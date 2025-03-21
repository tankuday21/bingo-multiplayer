"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { ArrowLeft, Copy, Users, Timer, AlertCircle, Trophy, Sparkles } from "lucide-react"
import { BingoCard } from "@/components/bingo-card"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeToggle } from "@/components/theme-toggle"

interface SocketError extends Error {
  description?: string;
  type?: string;
  context?: any;
  data?: any;
}

interface GameState {
  grid: number[][]
  currentTurn: string
  board: boolean[][]
  winner: string | null
  isGameOver: boolean
  gameStarted: boolean
}

function RoomContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [roomState, setRoomState] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializeSocket = () => {
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      })
      setSocket(newSocket)

      // Socket event listeners
      newSocket.on("connect", () => {
        console.log("Connected to server")
        setIsConnected(true)
        setIsLoading(false)
        setError(null)
        newSocket.emit("joinRoom", { roomId: params.roomId })
      })

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error)
        setIsConnected(false)
        setIsLoading(false)
        setError("Failed to connect to the game server. Please try again.")
        toast({
          title: "Connection Error",
          description: "Failed to connect to the game server. Please try again.",
          variant: "destructive",
        })
      })

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from server:", reason)
        setIsConnected(false)
        setIsLoading(false)
        if (reason === "io server disconnect") {
          setError("You have been disconnected from the server. Please refresh the page.")
          toast({
            title: "Disconnected",
            description: "You have been disconnected from the server. Please refresh the page.",
            variant: "destructive",
          })
        }
      })

      newSocket.on("roomState", (state) => {
        console.log("Received room state:", state)
        setRoomState(state)
      })

      newSocket.on("gameState", (state: GameState) => {
        console.log("Received game state:", state)
        setGameState(state)
        setIsLoading(false)
        setError(null)
      })

      newSocket.on("error", (error: { message: string }) => {
        console.error("Socket error:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      })
    }

    initializeSocket()

    // Set a timeout for loading state
    timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError("Connection timeout. Please refresh the page.")
        toast({
          title: "Connection Timeout",
          description: "Failed to connect to the server. Please refresh the page.",
          variant: "destructive",
        })
      }
    }, 15000)

    return () => {
      if (socket) {
        socket.disconnect()
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [params.roomId, toast])

  const handleCellClick = (row: number, col: number) => {
    if (!socket || !gameState || gameState.currentTurn !== socket.id) return

    socket.emit("selectCell", {
      roomId: params.roomId,
      row,
      col,
    })
  }

  const handleStartGame = () => {
    if (!socket) return
    socket.emit("startGame", params.roomId)
  }

  const handleLeaveRoom = () => {
    if (!socket) return
    socket.emit("leaveRoom", params.roomId)
    router.push("/")
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">{error}</h1>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading game...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Waiting for game to start...</h1>
          <Button onClick={handleStartGame}>Start Game</Button>
          <Button variant="outline" onClick={handleLeaveRoom} className="ml-2">
            Leave Room
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bingo Game</h1>
        <Button variant="outline" onClick={handleLeaveRoom}>
          Leave Room
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {gameState.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square border rounded-lg text-xl font-bold ${
                gameState.board[rowIndex][colIndex]
                  ? "bg-green-500 text-white"
                  : "bg-white dark:bg-gray-800"
              } ${
                gameState.currentTurn === socket?.id
                  ? "hover:bg-green-100 dark:hover:bg-green-900"
                  : ""
              }`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={gameState.currentTurn !== socket?.id || gameState.isGameOver}
            >
              {cell}
            </button>
          ))
        )}
      </div>

      <div className="text-center">
        {gameState.isGameOver ? (
          <h2 className="text-xl font-bold">
            {gameState.winner === socket?.id ? "You won!" : "Game Over!"}
          </h2>
        ) : (
          <h2 className="text-xl font-bold">
            {gameState.currentTurn === socket?.id
              ? "Your turn!"
              : "Waiting for opponent..."}
          </h2>
        )}
      </div>
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

