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

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface RoomState {
  id: string;
  players: Player[];
  gameState: GameState;
  createdAt: Date;
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
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeSocket = () => {
      try {
        // Initialize socket connection with better error handling
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        console.log('Connecting to socket server:', socketUrl);
        
        const newSocket = io(socketUrl, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ['websocket', 'polling'],
          autoConnect: true,
          forceNew: true // Force a new connection each time
        });

        if (!isMounted) return;
        setSocket(newSocket);

        // Socket event listeners
        newSocket.on("connect", () => {
          if (!isMounted) return;
          console.log("Connected to server successfully");
          setIsConnected(true);
          setIsLoading(false);
          setError(null);
          retryCount = 0;
          
          // Check if we're creating or joining a room
          const isCreatingRoom = params.roomId === 'new';
          if (isCreatingRoom) {
            const newRoomId = Math.random().toString(36).substring(2, 8);
            console.log('Creating new room:', newRoomId);
            // Wait a bit before creating the room to ensure socket is ready
            setTimeout(() => {
              if (isMounted) {
                console.log('Emitting createRoom event');
                newSocket.emit("createRoom", newRoomId);
              }
            }, 500); // Increased delay to ensure socket is ready
          } else {
            console.log('Joining existing room:', params.roomId);
            newSocket.emit("joinRoom", params.roomId);
          }
        });

        newSocket.on("connect_error", (error) => {
          if (!isMounted) return;
          console.error("Connection error:", error);
          setIsConnected(false);
          setIsLoading(false);
          setError(`Failed to connect to the game server: ${error.message}`);
          toast({
            title: "Connection Error",
            description: `Failed to connect to the game server: ${error.message}`,
            variant: "destructive",
          });
        });

        newSocket.on("disconnect", (reason) => {
          if (!isMounted) return;
          console.log("Disconnected from server:", reason);
          setIsConnected(false);
          setIsLoading(false);
          if (reason === "io server disconnect") {
            setError("You have been disconnected from the server. Please refresh the page.");
            toast({
              title: "Disconnected",
              description: "You have been disconnected from the server. Please refresh the page.",
              variant: "destructive",
            });
          }
        });

        newSocket.on("roomCreated", (room) => {
          if (!isMounted) return;
          console.log("Room created successfully:", room);
          setRoomState(room);
          setGameState(room.gameState);
          // Wait a bit before redirecting to ensure state is updated
          setTimeout(() => {
            if (isMounted) {
              console.log('Redirecting to room:', room.id);
              router.push(`/room/${room.id}`);
            }
          }, 500); // Increased delay
        });

        newSocket.on("roomState", (state) => {
          if (!isMounted) return;
          console.log("Received room state:", state);
          setRoomState(state);
        });

        newSocket.on("gameState", (state) => {
          if (!isMounted) return;
          console.log("Received game state:", state);
          setGameState(state);
          setIsLoading(false);
          setError(null);
        });

        newSocket.on("error", (error: { message: string }) => {
          if (!isMounted) return;
          console.error("Socket error:", error);
          
          // Handle room not found error with retry
          if (error.message === 'Room not found' && retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying room join (attempt ${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => {
              if (isMounted && socket) {
                socket.emit("joinRoom", params.roomId);
              }
            }, 1000 * retryCount);
            return;
          }

          setError(error.message);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
      } catch (error: any) {
        console.error("Error initializing socket:", error);
        if (isMounted) {
          setError(`Failed to initialize game connection: ${error.message}`);
          toast({
            title: "Error",
            description: `Failed to initialize game connection: ${error.message}`,
            variant: "destructive",
          });
        }
      }
    };

    initializeSocket();

    // Set a timeout for loading state
    timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        setError("Connection timeout. Please refresh the page.");
        toast({
          title: "Connection Timeout",
          description: "Failed to connect to the server. Please refresh the page.",
          variant: "destructive",
        });
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [params.roomId, toast, router]);

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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Room Info */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bingo Game</h1>
            {roomState && (
              <p className="text-lg text-gray-600">
                Room Code: <span className="font-mono font-bold">{roomState.id}</span>
              </p>
            )}
          </div>
          <div className="flex gap-4">
            {roomState?.players.find((p: Player) => p.id === socket?.id)?.isHost && (
              <Button
                onClick={handleStartGame}
                disabled={!isConnected || roomState.players.length < 2}
              >
                Start Game
              </Button>
            )}
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>
        </div>

        {/* Game Board */}
        {gameState && (
          <div className="grid grid-cols-5 gap-2">
            {gameState.grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "aspect-square border-2 rounded-lg flex items-center justify-center text-lg font-bold cursor-pointer transition-colors",
                    gameState.board[rowIndex][colIndex] ? "bg-green-100 border-green-500" : "border-gray-300 hover:border-blue-500",
                    gameState.currentTurn === socket?.id ? "hover:bg-blue-50" : "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell}
                </div>
              ))
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Loading game...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-500">
            <h2 className="text-xl font-semibold mb-4">{error}</h2>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        )}

        {/* Waiting State */}
        {!isLoading && !error && !gameState && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Waiting for game to start...</h2>
            <p className="text-gray-600">Share the room code with another player to begin</p>
          </div>
        )}

        {/* Player List */}
        {roomState && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            <div className="grid grid-cols-2 gap-4">
              {roomState.players.map((player: Player) => (
                <div
                  key={player.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    player.isHost ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <p className="font-medium">{player.name}</p>
                  {player.isHost && <span className="text-sm text-blue-600">(Host)</span>}
                </div>
              ))}
            </div>
          </div>
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

