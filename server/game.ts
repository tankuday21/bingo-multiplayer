import { Server, Socket } from "socket.io"
import { v4 as uuidv4 } from "uuid"

interface Player {
  id: string
  username: string
  completedLines: number
  isWinner: boolean
}

interface GameState {
  grid: number[][]
  markedCells: boolean[][]
  currentTurn: string
  players: Player[]
  winners: string[]
  gameStarted: boolean
  gameEnded: boolean
  turnTimer: number
}

class Game {
  private io: Server
  private rooms: Map<string, GameState> = new Map()
  private turnTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(io: Server) {
    this.io = io
  }

  private generateGrid(): number[][] {
    const grid: number[][] = []
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
    
    // Shuffle numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    // Create 5x5 grid
    for (let i = 0; i < 5; i++) {
      grid.push(numbers.slice(i * 5, (i + 1) * 5))
    }

    return grid
  }

  private checkLines(markedCells: boolean[][]): number {
    let completedLines = 0

    // Check rows
    for (let i = 0; i < 5; i++) {
      if (markedCells[i].every((cell) => cell)) completedLines++
    }

    // Check columns
    for (let i = 0; i < 5; i++) {
      if (markedCells.every((row) => row[i])) completedLines++
    }

    // Check diagonals
    if (markedCells.every((row, i) => row[i])) completedLines++
    if (markedCells.every((row, i) => row[4 - i])) completedLines++

    return completedLines
  }

  private startTurnTimer(roomId: string, username: string) {
    // Clear existing timer
    if (this.turnTimers.has(roomId)) {
      clearTimeout(this.turnTimers.get(roomId))
      this.turnTimers.delete(roomId)
    }

    // Start new timer
    let timeLeft = 20
    const timer = setInterval(() => {
      timeLeft--
      this.io.to(roomId).emit("turn_timer", timeLeft)

      if (timeLeft <= 0) {
        clearInterval(timer)
        this.turnTimers.delete(roomId)
        this.skipTurn(roomId)
      }
    }, 1000)

    this.turnTimers.set(roomId, timer)
  }

  private skipTurn(roomId: string) {
    const gameState = this.rooms.get(roomId)
    if (!gameState) return

    const currentPlayerIndex = gameState.players.findIndex(
      (p) => p.username === gameState.currentTurn
    )
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length

    gameState.currentTurn = gameState.players[nextPlayerIndex].username
    this.io.to(roomId).emit("game_state", gameState)
    this.io.to(roomId).emit("player_skipped", gameState.players[currentPlayerIndex].username)
    this.startTurnTimer(roomId, gameState.currentTurn)
  }

  public handleJoinRoom(socket: Socket, roomId: string, username: string) {
    socket.join(roomId)

    let gameState = this.rooms.get(roomId)
    if (!gameState) {
      gameState = {
        grid: this.generateGrid(),
        markedCells: Array(5)
          .fill(null)
          .map(() => Array(5).fill(false)),
        currentTurn: username,
        players: [],
        winners: [],
        gameStarted: false,
        gameEnded: false,
        turnTimer: 20,
      }
      this.rooms.set(roomId, gameState)
    }

    // Add player if not already in the game
    if (!gameState.players.find((p) => p.username === username)) {
      gameState.players.push({
        id: socket.id,
        username,
        completedLines: 0,
        isWinner: false,
      })
    }

    this.io.to(roomId).emit("game_state", gameState)
  }

  public handleStartGame(roomId: string) {
    const gameState = this.rooms.get(roomId)
    if (!gameState) return

    gameState.gameStarted = true
    this.io.to(roomId).emit("game_state", gameState)
    this.startTurnTimer(roomId, gameState.currentTurn)
  }

  public handleMarkCell(roomId: string, username: string, row: number, col: number) {
    const gameState = this.rooms.get(roomId)
    if (!gameState || gameState.currentTurn !== username || gameState.gameEnded) return

    // Mark the cell
    gameState.markedCells[row][col] = true

    // Check for completed lines
    const completedLines = this.checkLines(gameState.markedCells)
    const player = gameState.players.find((p) => p.username === username)
    if (player) {
      player.completedLines = completedLines
    }

    // Check for winner (5 lines completed)
    if (completedLines >= 5 && !gameState.winners.includes(username)) {
      gameState.winners.push(username)
      this.io.to(roomId).emit("player_win", username)

      // Check if game is over (all players have won)
      if (gameState.winners.length === gameState.players.length) {
        gameState.gameEnded = true
        this.io.to(roomId).emit("game_end")
        return
      }
    }

    // Move to next player
    const currentPlayerIndex = gameState.players.findIndex(
      (p) => p.username === gameState.currentTurn
    )
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length
    gameState.currentTurn = gameState.players[nextPlayerIndex].username

    this.io.to(roomId).emit("game_state", gameState)
    this.startTurnTimer(roomId, gameState.currentTurn)
  }

  public handleLeaveRoom(roomId: string, username: string) {
    const gameState = this.rooms.get(roomId)
    if (!gameState) return

    // Remove player
    gameState.players = gameState.players.filter((p) => p.username !== username)

    // If no players left, remove the room
    if (gameState.players.length === 0) {
      this.rooms.delete(roomId)
      if (this.turnTimers.has(roomId)) {
        clearTimeout(this.turnTimers.get(roomId))
        this.turnTimers.delete(roomId)
      }
      return
    }

    // If current player left, move to next player
    if (gameState.currentTurn === username) {
      const currentPlayerIndex = gameState.players.findIndex(
        (p) => p.username === username
      )
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length
      gameState.currentTurn = gameState.players[nextPlayerIndex].username
      this.startTurnTimer(roomId, gameState.currentTurn)
    }

    this.io.to(roomId).emit("game_state", gameState)
  }
}

export default Game 