"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Medal, Crown, Star } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useLeaderboard } from "@/hooks/useLeaderboard"
import { debugUserStats } from '@/lib/points-system'

type LeaderboardEntry = {
  rank: number
  id: string
  name: string
  wallet_address: string
  care_points: number
  current_streak: number
  longest_streak: number
  total_checkins: number
  user_stats?: {
    current_streak: number
    longest_streak: number
    total_checkins: number
    total_points: number
    level: number
    last_checkin?: string
  }
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const {
    leaderboard,
    isLoading: loading,
    isError: error,
    refresh,
    totalUsers,
  } = useLeaderboard({ period: "all-time", category: "overall", limit: 50 })

  // Debug function integrated into main component
  const debugUser = async () => {
    if (!user?.id) {
      console.log('No user ID available for debugging')
      return
    }
    // Use the actual user's ID instead of placeholder
    await debugUserStats(user.id)
    console.log('Debug complete - check console for results')
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <Star className="h-5 w-5 text-gray-400" />
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    return "bg-gray-100 text-gray-700"
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Community Leaderboard</h1>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Community Leaderboard</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">Leaderboard failed to load. Please try again.</p>
              <Button onClick={() => refresh()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Community Leaderboard</h1>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => refresh()}>
            Refresh
          </Button>
        </div>

        {/* Debug button - only show in development or for testing */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="mb-4">
            <Button 
              onClick={debugUser}
              variant="destructive"
              size="sm"
              className="bg-red-500 hover:bg-red-600"
            >
              🔍 Debug User Stats
            </Button>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Top Contributors
            </CardTitle>
            <CardDescription>
              Community members ranked by CARE points earned through wellness activities
            </CardDescription>
          </CardHeader>
        </Card>

        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No users on the leaderboard yet.</p>
              <p className="text-sm text-gray-500">Be the first to set your name and start earning CARE points!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <Card
                key={entry.id}
                className={`transition-all duration-200 ${
                  entry.id === user?.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                } ${entry.rank <= 3 ? "shadow-lg" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12">
                        <Badge className={`${getRankBadge(entry.rank)} px-3 py-1 text-sm font-bold`}>
                          #{entry.rank}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {entry.name}
                            {entry.id === user?.id && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">{entry.handle || formatAddress(entry.id)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{entry.points}</div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{entry.streak} day streak</div>
                        <div>{entry.total_checkins} check-ins</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">How to Earn CARE Points</h3>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Daily Mood Check-in: 10 points</Badge>
              <Badge variant="outline">Journal Entry: 15 points</Badge>
              <Badge variant="outline">Community Post: 5 points</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
