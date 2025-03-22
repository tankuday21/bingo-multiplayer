import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import Game from "./game"

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

const game = new Game(io)

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("join_room", ({ roomId, username }) => {
    console.log(`Player ${username} joined room ${roomId}`)
    game.handleJoinRoom(socket, roomId, username)
  })

  socket.on("start_game", ({ roomId }) => {
    console.log(`Game started in room ${roomId}`)
    game.handleStartGame(roomId)
  })

  socket.on("mark_cell", ({ roomId, username, row, col }) => {
    console.log(`Player ${username} marked cell (${row}, ${col}) in room ${roomId}`)
    game.handleMarkCell(roomId, username, row, col)
  })

  socket.on("leave_room", ({ roomId, username }) => {
    console.log(`Player ${username} left room ${roomId}`)
    game.handleLeaveRoom(roomId, username)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 