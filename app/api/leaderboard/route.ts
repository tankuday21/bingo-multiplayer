import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("bingo")
    const collection = db.collection("leaderboard")

    const leaderboard = await collection
      .find({})
      .sort({ wins: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    // Return empty leaderboard instead of error in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
