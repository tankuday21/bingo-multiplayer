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
  }
});

// Middleware
app.use(helmet());
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
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Game state
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createRoom', async (roomId) => {
    try {
      const db = await client.connect().then(client => client.db('bingo'));
      const collection = db.collection('rooms');
      
      const room = {
        id: roomId,
        players: [{
          id: socket.id,
          name: 'Player 1',
          isHost: true
        }],
        gameState: {
          currentTurn: socket.id,
          board: Array(5).fill().map(() => Array(5).fill(false)),
          winner: null,
          isGameOver: false
        },
        createdAt: new Date()
      };

      await collection.insertOne(room);
      rooms.set(roomId, room);
      socket.join(roomId);
      io.to(roomId).emit('roomCreated', room);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('joinRoom', async (roomId) => {
    try {
      const db = await client.connect().then(client => client.db('bingo'));
      const collection = db.collection('rooms');
      
      const room = await collection.findOne({ id: roomId });
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length >= 2) {
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
      io.to(roomId).emit('playerJoined', { room, newPlayer });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('selectCell', async ({ roomId, row, col }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.gameState.currentTurn !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      if (room.gameState.board[row][col]) {
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

      const db = await client.connect().then(client => client.db('bingo'));
      const collection = db.collection('rooms');
      await collection.updateOne(
        { id: roomId },
        { $set: { gameState: room.gameState } }
      );

      io.to(roomId).emit('gameStateUpdated', room.gameState);
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
            const db = await client.connect().then(client => client.db('bingo'));
            const collection = db.collection('rooms');
            await collection.deleteOne({ id: roomId });
          } catch (error) {
            console.error('Error deleting room:', error);
          }
        } else {
          rooms.set(roomId, room);
          try {
            const db = await client.connect().then(client => client.db('bingo'));
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