import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bingo Multiplayer</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/leaderboard">
              <Button variant="ghost">Leaderboard</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-center gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              Welcome to Bingo Multiplayer
            </h1>
            <p className="max-w-[700px] text-center text-muted-foreground">
              Create a new room or join an existing one to play with friends.
            </p>
          </div>
          <div className="grid w-full max-w-sm items-center gap-6 mx-auto">
            <HomeActions />
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bingo Multiplayer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
;("use client")

function HomeActions() {
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

