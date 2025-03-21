"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CreateRoomPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const username = searchParams.get("username")
  const gridSize = searchParams.get("gridSize") || "5"

  useEffect(() => {
    // Generate a random 6-character room code
    const generateRoomCode = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let result = ""
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      return result
    }

    const roomCode = generateRoomCode()

    // Redirect to the room page
    router.push(`/room/${roomCode}?username=${encodeURIComponent(username || "Guest")}&gridSize=${gridSize}`)
  }, [router, username, gridSize])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Creating your room...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}

