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
  const [roomState, setRoomState] = useState<RoomState | null>(null)
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
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        console.log('Connecting to socket server:', socketUrl);
        
        const newSocket = io(socketUrl, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ['websocket', 'polling'],
          autoConnect: true,
          forceNew: true
        });

        if (!isMounted) return;
        setSocket(newSocket);

        newSocket.on("connect", () => {
          if (!isMounted) return;
          console.log("Connected to server successfully");
          setIsConnected(true);
          setIsLoading(false);
          setError(null);
          retryCount = 0;
          
          const isCreatingRoom = params.roomId === 'new';
          if (isCreatingRoom) {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            console.log('Creating new room:', newRoomId);
            setTimeout(() => {
              if (isMounted) {
                console.log('Emitting createRoom event');
                newSocket.emit("createRoom", newRoomId);
              }
            }, 1000);
          } else {
            console.log('Checking room existence before joining:', params.roomId);
            newSocket.emit("checkRoom", params.roomId);
          }
        });

        newSocket.on("roomCreated", (room) => {
          if (!isMounted) return;
          console.log("Room created successfully:", room);
          setRoomState(room);
          setGameState(room.gameState);
          setIsLoading(false);
          
          toast({
            title: "Room Created Successfully",
            description: `Your room code is: ${room.id}`,
            variant: "default",
          });
        });

        newSocket.on("roomCheckResult", (result) => {
          if (!isMounted) return;
          console.log('Room check result:', result);
          
          if (result.exists) {
            console.log('Room exists, attempting to join');
            newSocket.emit("joinRoom", params.roomId);
          } else {
            console.log('Room does not exist');
            setError("Room not found. Please create a new room or check the room code.");
            toast({
              title: "Room Not Found",
              description: "The room you're trying to join doesn't exist. Please create a new room or check the room code.",
              variant: "destructive",
            });
            router.push('/');
          }
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
    if (!socket) return;
    socket.emit("startGame", params.roomId);
  }

  const handleLeaveRoom = () => {
    if (!socket) return;
    socket.emit("leaveRoom", params.roomId);
    router.push("/");
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Room Info */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bingo Game</h1>
            {roomState && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="text-lg">
                    Room Code: <span className="font-mono font-bold text-xl">{roomState.id}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(roomState.id);
                      toast({
                        title: "Copied!",
                        description: "Room code copied to clipboard",
                        variant: "default",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <p className="text-lg text-gray-600">
                    Players: {roomState.players.length}/2
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {roomState?.players.find((p) => p.id === socket?.id)?.isHost && (
              <Button
                onClick={handleStartGame}
                disabled={!isConnected || (roomState?.players.length || 0) < 2}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Game
              </Button>
            )}
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>
        </div>

        {/* Player List */}
        {roomState && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Players
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {roomState.players.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    player.isHost 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-white border-gray-200",
                    player.id === socket?.id && "ring-2 ring-blue-500"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{player.name}</p>
                    {player.isHost && (
                      <span className="text-sm text-blue-600 font-semibold px-2 py-1 bg-blue-100 rounded-full">
                        Host
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {roomState.players.length === 1 && (
                <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                  <p className="text-gray-500">Waiting for player...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Board */}
        {gameState && gameState.gameStarted && (
          <div className="mt-8">
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

