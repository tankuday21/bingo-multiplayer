"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft, Copy, Users, Timer, AlertCircle } from "lucide-react"
import { BingoCard } from "@/components/bingo-card"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"

interface Player {
  id: string
  username: string
  score: number
  grid: number[][]
  markedCells: boolean[][]
}

interface GameState {
  roomId: string
  players: Player[]
  currentTurn: string
  calledNumbers: number[]
  turnTimeLeft: number
  gridSize: number
  gameStarted: boolean
  gameEnded: boolean
  winner: string | null
}

function RoomContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const username = searchParams.get("username") || "Guest"
  const { toast } = useToast()

  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!socketUrl) {
      toast({
        title: "Connection Error",
        description: "Server URL is not configured. Please try again later.",
        variant: "destructive",
      })
      return
    }

    const newSocket = io(socketUrl, {
      query: {
        roomId,
        username,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["websocket", "polling"],
      forceNew: true,
    })

    setSocket(newSocket)

    // Socket event listeners
    newSocket.on("connect", () => {
      setIsConnected(true)
      setIsReconnecting(false)
      console.log("Connected to server")
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    newSocket.on("reconnecting", () => {
      setIsReconnecting(true)
      console.log("Reconnecting to server...")
    })

    newSocket.on("gameState", (state: GameState) => {
      setGameState(state)

      // Find current player
      const currentPlayer = state.players.find((p) => p.id === newSocket.id)
      if (currentPlayer) {
        setPlayer(currentPlayer)
      }
    })

    newSocket.on("error", (error: string) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    })

    newSocket.on("roomFull", () => {
      toast({
        title: "Room is full",
        description: "This room has reached its maximum capacity of 8 players.",
        variant: "destructive",
      })
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        window.location.href = "/"
      }, 3000)
    })

    newSocket.on("gameWon", (winner: string) => {
      toast({
        title: "Game Over!",
        description: `${winner} has won the game!`,
      })
    })

    // Cleanup
    return () => {
      newSocket.disconnect()
    }
  }, [roomId, username, toast])

  const handleCellClick = (row: number, col: number) => {
    if (!socket || !gameState || !player || !gameState.gameStarted || gameState.gameEnded) return

    const value = player.grid[row][col]

    // Check if the number has been called
    if (gameState.calledNumbers.includes(value)) {
      socket.emit("markCell", { row, col })
    }
  }

  const handleStartGame = () => {
    if (!socket) return
    socket.emit("startGame")
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    toast({
      title: "Room code copied",
      description: "The room code has been copied to your clipboard.",
    })
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold">{isReconnecting ? "Reconnecting..." : "Connecting to server..."}</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </motion.div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold">Loading game...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Bingo Room</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyRoomCode}>
                Room: {roomId} <Copy className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{gameState.players.length}/8</span>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 container py-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {!gameState.gameStarted && gameState.players.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Button onClick={handleStartGame} size="lg" className="animate-pulse">
                  Start Game
                </Button>
              </motion.div>
            )}

            {!gameState.gameStarted && gameState.players.length < 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 border rounded-lg bg-card"
              >
                <h2 className="text-xl font-semibold mb-2">Waiting for players...</h2>
                <p className="text-muted-foreground">Share the room code with your friends to start playing.</p>
              </motion.div>
            )}

            {gameState.gameStarted && player && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold">Your Bingo Card</h2>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Timer className="h-4 w-4" />
                    <span>
                      Turn: {gameState.currentTurn === socket?.id ? "Your turn" : "Opponent's turn"}
                      {gameState.turnTimeLeft > 0 && <span className="ml-2">({gameState.turnTimeLeft}s)</span>}
                    </span>
                  </div>
                </div>

                <BingoCard
                  grid={player.grid}
                  markedCells={player.markedCells}
                  calledNumbers={gameState.calledNumbers}
                  onCellClick={handleCellClick}
                  isCurrentTurn={gameState.currentTurn === socket?.id}
                  disabled={!gameState.gameStarted || gameState.gameEnded}
                />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold mb-4">Players</h3>
              <div className="space-y-2">
                {gameState.players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md",
                      p.id === socket?.id ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <span>{p.username}</span>
                    <span className="text-sm text-muted-foreground">{p.score} points</span>
                  </div>
                ))}
              </div>
            </div>

            {gameState.gameStarted && (
              <div className="bg-card rounded-lg p-4 shadow-lg">
                <h3 className="font-semibold mb-4">Called Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {gameState.calledNumbers.map((num) => (
                    <motion.div
                      key={num}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      {num}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function RoomPage() {
  return (
    <ErrorBoundary>
      <RoomContent />
    </ErrorBoundary>
  )
}

