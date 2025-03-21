require('dotenv').config({ path: '.env.local' })
const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const { MongoClient } = require("mongodb")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")

// Environment variables
const {
  MONGODB_URI,
  MONGODB_DB = 'bingo-multiplayer',
  NODE_ENV = 'development',
  PORT = 3000,
  CORS_ORIGINS = 'https://bingo-multiplayer-hazel.vercel.app',
  JWT_SECRET,
  SOCKET_PATH = '/socket.io/'
} = process.env;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required but not set');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET is required but not set');
  process.exit(1);
}

// Parse CORS origins
const corsOrigins = CORS_ORIGINS.split(',').map(origin => origin.trim());

// Initialize Express app
const app = express()

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))
app.use(compression())
app.use(express.json({ limit: "10kb" }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (CORS_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}))

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.io with production settings
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      console.log('Incoming connection from origin:', origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('Allowing connection with no origin');
        return callback(null, true);
      }
      // Allow all origins in development
      if (NODE_ENV === 'development') {
        return callback(null, true);
      }
      // In production, check against corsOrigins
      if (corsOrigins.some(allowedOrigin => origin.includes(allowedOrigin))) {
        console.log('Origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  path: SOCKET_PATH,
  serveClient: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 32768
  },
  cookie: {
    name: 'io',
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  }
});

// Add connection error handling with more detailed logging
io.engine.on("connection_error", (err) => {
  console.log('Connection error:', {
    code: err.code,
    message: err.message,
    type: err.type,
    req: {
      url: err.req?.url,
      headers: err.req?.headers,
      query: err.req?.query
    },
    context: err.context
  });
});

// Add general error handling for the io instance
io.on("error", (error) => {
  console.error("Socket.IO error:", error);
});

// MongoDB connection with retry logic
let db
const connectWithRetry = async (retries = 5) => {
  try {
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    db = client.db(process.env.MONGODB_DB || "bingo")
    console.log("MongoDB connected successfully")
  } catch (err) {
    console.error("MongoDB connection error:", err)
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`)
      setTimeout(() => connectWithRetry(retries - 1), 5000)
    } else {
      console.error("Failed to connect to MongoDB after multiple attempts")
      process.exit(1)
    }
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    status: "error",
    message: NODE_ENV === "production" ? "Internal Server Error" : err.message
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" })
})

// Start server
const startServer = async () => {
  try {
    await connectWithRetry()
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`)
    })
  } catch (err) {
    console.error("Failed to start server:", err)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

// Store active rooms in memory
const rooms = new Map()

// Helper functions
function generateGrid(size) {
  const grid = []
  const totalCells = size * size
  const numbers = Array.from({ length: totalCells }, (_, i) => i + 1)

  // Shuffle numbers
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }

  // Create grid
  for (let i = 0; i < size; i++) {
    const row = []
    for (let j = 0; j < size; j++) {
      row.push(numbers[i * size + j])
    }
    grid.push(row)
  }

  return grid
}

function createEmptyMarkedCells(size) {
  return Array(size)
    .fill()
    .map(() => Array(size).fill(false))
}

function checkWin(markedCells) {
  const size = markedCells.length
  let completedLines = 0

  // Check rows
  for (let i = 0; i < size; i++) {
    if (markedCells[i].every((cell) => cell)) {
      completedLines++
    }
  }

  // Check columns
  for (let i = 0; i < size; i++) {
    let columnComplete = true
    for (let j = 0; j < size; j++) {
      if (!markedCells[j][i]) {
        columnComplete = false
        break
      }
    }
    if (columnComplete) {
      completedLines++
    }
  }

  // Check main diagonal
  let mainDiagonalComplete = true
  for (let i = 0; i < size; i++) {
    if (!markedCells[i][i]) {
      mainDiagonalComplete = false
      break
    }
  }
  if (mainDiagonalComplete) {
    completedLines++
  }

  // Check other diagonal
  let otherDiagonalComplete = true
  for (let i = 0; i < size; i++) {
    if (!markedCells[i][size - 1 - i]) {
      otherDiagonalComplete = false
      break
    }
  }
  if (otherDiagonalComplete) {
    completedLines++
  }

  return completedLines >= 5
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("New client connected:", {
    id: socket.id,
    query: socket.handshake.query,
    headers: socket.handshake.headers,
    address: socket.handshake.address
  });

  const { roomId, username } = socket.handshake.query;
  const gridSize = Number.parseInt(socket.handshake.query.gridSize) || 5;

  if (!roomId || !username) {
    console.log('Missing roomId or username, disconnecting socket:', socket.id);
    socket.disconnect();
    return;
  }

  // Join room
  socket.join(roomId);
  console.log(`Socket ${socket.id} joined room ${roomId}`);

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    console.log(`Creating new room: ${roomId}`);
    rooms.set(roomId, {
      id: roomId,
      players: [],
      gameStarted: false,
      gameEnded: false,
      currentTurn: null,
      calledNumbers: [],
      turnTimeLeft: 0,
      gridSize: gridSize,
      winner: null,
      lastActivity: new Date(),
    });
  }

  // Get room data
  const room = rooms.get(roomId);

  // Check if room is full
  if (room.players.length >= 8) {
    console.log(`Room ${roomId} is full, disconnecting socket:`, socket.id);
    socket.emit("roomFull");
    socket.disconnect();
    return;
  }

  // Create player
  const player = {
    id: socket.id,
    username: username || "Guest",
    score: 0,
    grid: generateGrid(room.gridSize),
    markedCells: createEmptyMarkedCells(room.gridSize),
  }

  // Add player to room
  room.players.push(player)

  // Update room last activity
  room.lastActivity = new Date()

  // Save player to database
  if (db) {
    db.collection("players")
      .updateOne(
        { id: socket.id },
        {
          $setOnInsert: {
            id: socket.id,
            username: player.username,
            gamesPlayed: 0,
            gamesWon: 0,
            score: 0,
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )
      .catch((err) => console.error("Error saving player:", err))
  }

  // Emit game state to all players in the room
  io.to(roomId).emit("gameState", {
    roomId,
    players: room.players,
    currentTurn: room.currentTurn,
    calledNumbers: room.calledNumbers,
    turnTimeLeft: room.turnTimeLeft,
    gridSize: room.gridSize,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
    winner: room.winner,
  })

  // Start game event
  socket.on("startGame", () => {
    if (room.gameStarted || room.players.length < 2) return

    room.gameStarted = true
    room.currentTurn = room.players[0].id
    room.turnTimeLeft = 15

    // Start turn timer
    startTurnTimer(roomId)

    // Emit game state
    io.to(roomId).emit("gameState", {
      roomId,
      players: room.players,
      currentTurn: room.currentTurn,
      calledNumbers: room.calledNumbers,
      turnTimeLeft: room.turnTimeLeft,
      gridSize: room.gridSize,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      winner: room.winner,
    })

    // Save room to database
    if (db) {
      db.collection("rooms")
        .updateOne(
          { id: roomId },
          {
            $set: {
              id: roomId,
              playerCount: room.players.length,
              gameStarted: true,
              lastActivity: new Date(),
            },
          },
          { upsert: true },
        )
        .catch((err) => console.error("Error saving room:", err))

      // Update games played for all players
      room.players.forEach((player) => {
        db.collection("players")
          .updateOne({ id: player.id }, { $inc: { gamesPlayed: 1 } })
          .catch((err) => console.error("Error updating player:", err))
      })
    }
  })

  // Mark cell event
  socket.on("markCell", ({ row, col }) => {
    if (!room.gameStarted || room.gameEnded || room.currentTurn !== socket.id) return

    const player = room.players.find((p) => p.id === socket.id)
    if (!player) return

    const cellValue = player.grid[row][col]

    // Check if number has been called
    if (!room.calledNumbers.includes(cellValue)) {
      socket.emit("error", "This number has not been called yet")
      return
    }

    // Mark cell
    player.markedCells[row][col] = true

    // Check for win
    if (checkWin(player.markedCells)) {
      // Calculate score: 100 base points + time bonus
      const timeBonus = room.turnTimeLeft * 2
      const score = 100 + timeBonus
      player.score += score

      room.gameEnded = true
      room.winner = player.id

      // Update player in database
      if (db) {
        db.collection("players")
          .updateOne(
            { id: player.id },
            {
              $inc: {
                gamesWon: 1,
                score: score,
              },
            },
          )
          .catch((err) => console.error("Error updating player:", err))
      }

      // Emit game won event
      io.to(roomId).emit("gameWon", player.username)
    } else {
      // Move to next turn
      nextTurn(roomId)
    }

    // Emit game state
    io.to(roomId).emit("gameState", {
      roomId,
      players: room.players,
      currentTurn: room.currentTurn,
      calledNumbers: room.calledNumbers,
      turnTimeLeft: room.turnTimeLeft,
      gridSize: room.gridSize,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      winner: room.winner,
    })
  })

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)

    if (!room) return

    // Remove player from room
    room.players = room.players.filter((p) => p.id !== socket.id)

    // If room is empty, remove it
    if (room.players.length === 0) {
      rooms.delete(roomId)
      return
    }

    // If current turn player disconnected, move to next turn
    if (room.currentTurn === socket.id) {
      nextTurn(roomId)
    }

    // Emit game state
    io.to(roomId).emit("gameState", {
      roomId,
      players: room.players,
      currentTurn: room.currentTurn,
      calledNumbers: room.calledNumbers,
      turnTimeLeft: room.turnTimeLeft,
      gridSize: room.gridSize,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      winner: room.winner,
    })
  })

  socket.on('error', (error) => {
    console.log('Socket error:', {
      id: socket.id,
      room: roomId,
      error: error
    });
  });
})

// Turn timer function
function startTurnTimer(roomId) {
  const room = rooms.get(roomId)
  if (!room || !room.gameStarted || room.gameEnded) return

  const timerId = setInterval(() => {
    room.turnTimeLeft--

    // Emit updated time
    io.to(roomId).emit("gameState", {
      roomId,
      players: room.players,
      currentTurn: room.currentTurn,
      calledNumbers: room.calledNumbers,
      turnTimeLeft: room.turnTimeLeft,
      gridSize: room.gridSize,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      winner: room.winner,
    })

    // If time is up, auto-play for current player
    if (room.turnTimeLeft <= 0) {
      autoPlay(roomId)
      clearInterval(timerId)
    }
  }, 1000)
}

// Auto-play function
function autoPlay(roomId) {
  const room = rooms.get(roomId)
  if (!room || !room.gameStarted || room.gameEnded) return

  // Call a random number that hasn't been called yet
  const maxNumber = room.gridSize * room.gridSize
  const availableNumbers = []

  for (let i = 1; i <= maxNumber; i++) {
    if (!room.calledNumbers.includes(i)) {
      availableNumbers.push(i)
    }
  }

  if (availableNumbers.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const calledNumber = availableNumbers[randomIndex]
    room.calledNumbers.push(calledNumber)
  }

  // Move to next turn
  nextTurn(roomId)
}

// Next turn function
function nextTurn(roomId) {
  const room = rooms.get(roomId)
  if (!room || !room.gameStarted || room.gameEnded) return

  // Find current player index
  const currentPlayerIndex = room.players.findIndex((p) => p.id === room.currentTurn)

  // Move to next player
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length
  room.currentTurn = room.players[nextPlayerIndex].id

  // Reset turn timer
  room.turnTimeLeft = 15

  // Start turn timer
  startTurnTimer(roomId)

  // Update room last activity
  room.lastActivity = new Date()
}

// Clean up inactive rooms every minute
setInterval(() => {
  const now = new Date()

  rooms.forEach((room, roomId) => {
    const inactiveTime = now - room.lastActivity

    // If room is inactive for more than 10 minutes, remove it
    if (inactiveTime > 10 * 60 * 1000) {
      rooms.delete(roomId)
    }
  })
}, 60 * 1000)

// API routes
app.get("/api/rooms", (req, res) => {
  const roomsData = Array.from(rooms.values()).map((room) => ({
    id: room.id,
    playerCount: room.players.length,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
  }))

  res.json(roomsData)
})

app.get("/api/leaderboard", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected" })
    }

    const leaderboard = await db.collection("players").find({}).sort({ score: -1 }).limit(100).toArray()

    res.json(leaderboard)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({ error: "Failed to fetch leaderboard" })
  }
})

