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
  markedCells: boolean[][]
  currentTurn: string
  players: {
    id: string
    username: string
    completedLines: number
    isWinner: boolean
  }[]
  winners: string[]
  gameStarted: boolean
  gameEnded: boolean
  turnTimer: number
}

function RoomContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [username, setUsername] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)

  useEffect(() => {
    // Get username from localStorage
    const savedUsername = localStorage.getItem("username")
    if (savedUsername) {
      setUsername(savedUsername)
    } else {
      router.push("/")
      return
    }

    // Get roomId from URL params
    if (params.roomId) {
      setRoomId(params.roomId as string)
    }

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
    setSocket(newSocket)

    // Socket event listeners
    newSocket.on("connect", () => {
      setIsConnected(true)
      newSocket.emit("join_room", { roomId: params.roomId, username: savedUsername })
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
    })

    newSocket.on("game_state", (state: GameState) => {
      setGameState(state)
    })

    newSocket.on("turn_timer", (time: number) => {
      setTimeLeft(time)
    })

    newSocket.on("player_skipped", (skippedPlayer: string) => {
      toast({
        title: "Turn Skipped",
        description: `${skippedPlayer} didn't make a move in time.`,
      })
    })

    newSocket.on("player_win", (winner: string) => {
      toast({
        title: "Winner!",
        description: `${winner} has won the game!`,
      })
    })

    newSocket.on("game_end", () => {
      toast({
        title: "Game Over",
        description: "The game has ended. Check the leaderboard!",
      })
      router.push("/")
    })

    return () => {
      newSocket.disconnect()
    }
  }, [params.roomId, router, toast])

  const handleCellClick = (row: number, col: number) => {
    if (!socket || !gameState || gameState.currentTurn !== username) return

    socket.emit("mark_cell", {
      roomId,
      username,
      row,
      col,
    })
  }

  const handleStartGame = () => {
    if (!socket) return
    socket.emit("start_game", { roomId })
  }

  const handleLeaveRoom = () => {
    if (!socket) return
    socket.emit("leave_room", { roomId, username })
    router.push("/")
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

  const isCurrentTurn = gameState.currentTurn === username
  const isWinner = gameState.winners.includes(username)
  const playerRank = gameState.winners.indexOf(username) + 1

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 w-full border-b backdrop-blur-md bg-background/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Room: {roomId}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              {isCurrentTurn ? (
                <span className="text-green-500">Your turn! ({timeLeft}s)</span>
              ) : (
                <span className="text-muted-foreground">
                  {gameState.currentTurn}'s turn
                </span>
              )}
            </div>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="md:col-span-2">
            <BingoCard
              grid={gameState.grid}
              markedCells={gameState.markedCells}
              onCellClick={handleCellClick}
              isCurrentTurn={isCurrentTurn}
              disabled={!isCurrentTurn || gameState.gameEnded}
            />
          </div>

          {/* Players and Winners List */}
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold mb-4">Players</h2>
              <div className="space-y-2">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      player.username === username
                        ? "bg-primary/10"
                        : "bg-muted/50"
                    }`}
                  >
                    <span>{player.username}</span>
                    <span className="text-sm text-muted-foreground">
                      {player.completedLines} lines
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {gameState.winners.length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-lg font-semibold mb-4">Winners</h2>
                <div className="space-y-2">
                  {gameState.winners.map((winner, index) => (
                    <div
                      key={winner}
                      className="flex items-center gap-2 p-2 rounded bg-primary/10"
                    >
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>
                        {index + 1}. {winner}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

