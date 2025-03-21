"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy } from "lucide-react"

interface LeaderboardEntry {
  username: string
  score: number
  gamesPlayed: number
  gamesWon: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard")
        const data = await response.json()
        setLeaderboard(data)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        // For demo purposes, generate mock data
        const mockData: LeaderboardEntry[] = Array.from({ length: 20 }, (_, i) => ({
          username: `Player${i + 1}`,
          score: Math.floor(Math.random() * 5000) + 1000,
          gamesPlayed: Math.floor(Math.random() * 50) + 10,
          gamesWon: Math.floor(Math.random() * 20) + 1,
        })).sort((a, b) => b.score - a.score)

        setLeaderboard(mockData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Top Players</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Games</th>
                    <th className="px-4 py-3 text-right">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 text-white rounded-full">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-700 text-white rounded-full">
                            3
                          </span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{entry.username}</td>
                      <td className="px-4 py-3 text-right">{entry.score.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{entry.gamesPlayed}</td>
                      <td className="px-4 py-3 text-right">{entry.gamesWon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

