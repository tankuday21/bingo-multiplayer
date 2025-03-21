"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Users, Crown, ChevronLeft, Key, User, Grid3X3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence } from "framer-motion"

export function HomeActions() {
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [gridSize, setGridSize] = useState(5)
  const [isCreating, setIsCreating] = useState(false)
  const { theme } = useTheme()

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

  const variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }

  return (
    <motion.div
      className={cn(
        "p-6 rounded-xl border shadow-lg flex flex-col space-y-6 w-full max-w-sm mx-auto",
        "glass",
        theme === "neon" && "border-primary/30",
        theme === "galaxy" && "border-secondary/30",
        theme === "retro" && "border-2 border-primary",
        theme === "candy" && "border-accent/30"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Your Nickname</label>
        </div>
        <Input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={15}
          className="transition-all duration-200"
        />
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div 
            className="space-y-4"
            key="create"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Grid Size</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="5"
                  max="8"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number.parseInt(e.target.value))}
                  className="w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded-md text-primary">
                  {gridSize}x{gridSize}
                </span>
              </div>
            </div>
            <Button 
              onClick={handleCreateRoom} 
              className="w-full flex items-center gap-2 group" 
              disabled={!username}
            >
              <Crown className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Create Room
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsCreating(false)} 
              className="w-full flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            key="join"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Button 
              onClick={() => setIsCreating(true)} 
              className="w-full flex items-center gap-2 group" 
              disabled={!username}
            >
              <Crown className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Room Code</label>
              </div>
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="transition-all duration-200"
              />
            </div>
            
            <Button 
              onClick={handleJoinRoom} 
              className="w-full flex items-center gap-2 group" 
              disabled={!username || !roomCode}
              variant="secondary"
            >
              <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Join Room
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 