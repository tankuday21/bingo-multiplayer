const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:", "http:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());
app.use(compression());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
let db = null;
let mongoClient = null;

async function connectToMongoDB() {
  try {
    if (mongoClient) {
      return mongoClient.db('bingo');
    }

    mongoClient = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    });

    mongoClient.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoClient.on('close', () => {
      console.log('MongoDB connection closed');
      mongoClient = null;
    });

    db = mongoClient.db('bingo');
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Initialize MongoDB connection
connectToMongoDB().catch(console.error);

// Game state
const rooms = new Map();

// Clean up rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
      rooms.delete(roomId);
      if (db) {
        db.collection('rooms').deleteOne({ id: roomId }).catch(console.error);
      }
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Helper function to generate a random grid
function generateGrid() {
  const grid = Array(5).fill().map(() => Array(5).fill(0));
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      grid[i][j] = numbers.splice(randomIndex, 1)[0];
    }
  }
  
  return grid;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Set up ping/pong for connection health check
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('createRoom', async (roomId) => {
    try {
      console.log('Creating room:', roomId);
      if (!db) {
        db = await connectToMongoDB();
      }
      const collection = db.collection('rooms');
      
      // Check if room already exists
      const existingRoom = await collection.findOne({ id: roomId });
      if (existingRoom) {
        console.log('Room already exists:', roomId);
        socket.emit('error', { message: 'Room already exists' });
        return;
      }

      const room = {
        id: roomId,
        players: [{
          id: socket.id,
          name: 'Player 1',
          isHost: true
        }],
        gameState: {
          grid: generateGrid(),
          currentTurn: socket.id,
          board: Array(5).fill().map(() => Array(5).fill(false)),
          winner: null,
          isGameOver: false,
          gameStarted: false
        },
        createdAt: new Date()
      };

      // First add to in-memory rooms
      rooms.set(roomId, room);
      socket.join(roomId);

      // Then save to database
      await collection.insertOne(room);
      
      console.log('Room created successfully:', roomId);
      
      // Emit events to the creator
      socket.emit('roomCreated', room);
      socket.emit('gameState', room.gameState);
      
      // Log the room state for debugging
      console.log('Room state after creation:', {
        roomId,
        players: room.players,
        gameState: room.gameState
      });
    } catch (error) {
      console.error('Error creating room:', error);
      // Clean up in case of error
      rooms.delete(roomId);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('joinRoom', async (roomId) => {
    try {
      console.log('Joining room:', roomId);
      if (!db) {
        db = await connectToMongoDB();
      }
      const collection = db.collection('rooms');
      
      // First check in-memory rooms
      let room = rooms.get(roomId);
      
      // If not in memory, check database
      if (!room) {
        room = await collection.findOne({ id: roomId });
        if (!room) {
          console.log('Room not found:', roomId);
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        rooms.set(roomId, room);
      }

      // Check if player is already in the room
      if (room.players.some(p => p.id === socket.id)) {
        console.log('Player already in room:', socket.id);
        socket.join(roomId);
        socket.emit('roomState', room);
        socket.emit('gameState', room.gameState);
        return;
      }

      if (room.players.length >= 2) {
        console.log('Room is full:', roomId);
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      const playerNumber = room.players.length + 1;
      const newPlayer = {
        id: socket.id,
        name: `Player ${playerNumber}`,
        isHost: false
      };

      room.players.push(newPlayer);
      await collection.updateOne(
        { id: roomId },
        { $set: { players: room.players } }
      );
      
      rooms.set(roomId, room);
      socket.join(roomId);
      console.log('Player joined successfully:', {
        roomId,
        playerId: socket.id,
        playerNumber
      });
      
      // Emit room state first
      socket.emit('roomState', room);
      
      // Then emit game state
      if (room.gameState) {
        console.log('Emitting game state:', room.gameState);
        socket.emit('gameState', room.gameState);
      } else {
        console.log('No game state available, creating new one');
        const newGameState = {
          grid: generateGrid(),
          currentTurn: null,
          board: Array(5).fill().map(() => Array(5).fill(false)),
          winner: null,
          isGameOver: false,
          gameStarted: false
        };
        room.gameState = newGameState;
        await collection.updateOne(
          { id: roomId },
          { $set: { gameState: newGameState } }
        );
        socket.emit('gameState', newGameState);
      }
      
      // Notify other players
      socket.to(roomId).emit('playerJoined', { room, newPlayer });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('startGame', async (roomId) => {
    try {
      console.log('Starting game in room:', roomId);
      const room = rooms.get(roomId);
      if (!room) {
        console.log('Room not found:', roomId);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length < 2) {
        console.log('Not enough players:', roomId);
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      room.gameState.gameStarted = true;
      room.gameState.currentTurn = room.players[0].id;

      const collection = db.collection('rooms');
      await collection.updateOne(
        { id: roomId },
        { $set: { gameState: room.gameState } }
      );

      console.log('Game started, emitting gameState event');
      io.to(roomId).emit('gameState', room.gameState);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('selectCell', async ({ roomId, row, col }) => {
    try {
      console.log('Selecting cell:', { roomId, row, col });
      if (!db) {
        throw new Error('Database connection not available');
      }
      const room = rooms.get(roomId);
      if (!room) {
        console.log('Room not found:', roomId);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (!room.gameState) {
        console.log('No game state found:', roomId);
        socket.emit('error', { message: 'Game state not found' });
        return;
      }

      if (!room.gameState.gameStarted) {
        console.log('Game not started:', roomId);
        socket.emit('error', { message: 'Game has not started yet' });
        return;
      }

      if (room.gameState.currentTurn !== socket.id) {
        console.log('Not player\'s turn:', socket.id);
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      if (room.gameState.board[row][col]) {
        console.log('Cell already selected:', { row, col });
        socket.emit('error', { message: 'Cell already selected' });
        return;
      }

      room.gameState.board[row][col] = true;

      // Check for winner
      const winner = checkWinner(room.gameState.board);
      if (winner) {
        room.gameState.winner = socket.id;
        room.gameState.isGameOver = true;
      } else {
        // Switch turns
        const currentPlayerIndex = room.players.findIndex(p => p.id === socket.id);
        const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
        room.gameState.currentTurn = room.players[nextPlayerIndex].id;
      }

      const collection = db.collection('rooms');
      await collection.updateOne(
        { id: roomId },
        { $set: { gameState: room.gameState } }
      );

      console.log('Cell selected, emitting gameState event');
      io.to(roomId).emit('gameState', room.gameState);
    } catch (error) {
      console.error('Error selecting cell:', error);
      socket.emit('error', { message: 'Failed to update game state' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
          try {
            const collection = db.collection('rooms');
            await collection.deleteOne({ id: roomId });
          } catch (error) {
            console.error('Error deleting room:', error);
          }
        } else {
          rooms.set(roomId, room);
          try {
            const collection = db.collection('rooms');
            await collection.updateOne(
              { id: roomId },
              { $set: { players: room.players } }
            );
          } catch (error) {
            console.error('Error updating room:', error);
          }
          io.to(roomId).emit('playerLeft', { roomId, players: room.players });
        }
      }
    }
  });
});

// Helper function to check for winner
function checkWinner(board) {
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (board[i].every(cell => cell)) return true;
  }

  // Check columns
  for (let j = 0; j < 5; j++) {
    if (board.every(row => row[j])) return true;
  }

  // Check diagonals
  if (board.every((row, i) => row[i])) return true;
  if (board.every((row, i) => row[4 - i])) return true;

  return false;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 