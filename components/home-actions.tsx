"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function HomeActions() {
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [gridSize, setGridSize] = useState(5)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = () => {
    if (!username) return
    // Will redirect to the room page
    window.location.href = `/room/create?username=${encodeURIComponent(username)}&gridSize=${gridSize}`
  }

  const handleJoinRoom = () => {
    if (!username || !roomCode) return
    // Will redirect to the room page
    window.location.href = `/room/${roomCode}?username=${encodeURIComponent(username)}`
  }

  return (
    <>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={15}
        />
      </div>

      {isCreating ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Grid Size</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="5"
                max="8"
                value={gridSize}
                onChange={(e) => setGridSize(Number.parseInt(e.target.value))}
                className="w-full"
              />
              <span>
                {gridSize}x{gridSize}
              </span>
            </div>
          </div>
          <Button onClick={handleCreateRoom} className="w-full" disabled={!username}>
            Create Room
          </Button>
          <Button variant="outline" onClick={() => setIsCreating(false)} className="w-full">
            Back
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={() => setIsCreating(true)} className="w-full" disabled={!username}>
            Create a Room
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
          </div>
          <Button onClick={handleJoinRoom} className="w-full" disabled={!username || !roomCode}>
            Join Room
          </Button>
        </div>
      )}
    </>
  )
} 