"use client"

import { useAuth } from "@/hooks/useAuth"
import { WalletConnect } from "@/components/wallet-connect"
import { UsernamePrompt } from "@/components/username-prompt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, Users, Trophy, Zap, Calendar } from "lucide-react"
import Link from "next/link"

type User = {
  id: string
  name: string
  care_points: number
  total_checkins: number
  longest_streak: number
  user_stats?: {
    current_streak: number
    longest_streak: number
    total_checkins: number
    total_points: number
    level: number
    last_checkin?: string
  }
}

export default function HomePage() {
  const { user, isConnected, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return <WalletConnect />
  }

  // Show username prompt if user doesn't have a name set
  if (!user?.name || user.name.trim().length === 0) {
    return <UsernamePrompt />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Continue your mental health journey with GOOD CARE Network</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.care_points}</p>
              <p className="text-sm text-gray-600">Care Points</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.user_stats?.current_streak}</p>
              <p className="text-sm text-gray-600">Current Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.user_stats?.longest_streak}</p>
              <p className="text-sm text-gray-600">Longest Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.user_stats?.total_checkins}</p>
              <p className="text-sm text-gray-600">Total Check-ins</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Mood Tracker
              </CardTitle>
              <CardDescription>Log your daily mood and earn care points</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/mood-tracker">
                <Button className="w-full">Track Mood</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Journal
              </CardTitle>
              <CardDescription>Write your thoughts and reflections</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/journal">
                <Button className="w-full">Write Entry</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Community
              </CardTitle>
              <CardDescription>Connect with others on their journey</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/community">
                <Button className="w-full">Join Community</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>See how you rank in the community</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/leaderboard">
                <Button className="w-full">View Rankings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Goals
              </CardTitle>
              <CardDescription>Set and track your wellness goals</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/goals">
                <Button className="w-full">Manage Goals</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Insights
              </CardTitle>
              <CardDescription>View your wellness analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/insights">
                <Button className="w-full">View Insights</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Daily Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Today's Actions</CardTitle>
            <CardDescription>Complete these daily activities to earn care points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Mood Check-in
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Journal Entry
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Community Post
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
