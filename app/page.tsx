"use client"

import { useAuth } from "@/hooks/useAuth"
import { WalletConnect } from "@/components/wallet-connect"
import { UsernamePrompt } from "@/components/username-prompt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, Users, Trophy, Zap, Calendar, CheckCircle, User, LogOut, Edit2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HomePage() {
  const { user, isConnected, isLoading, disconnectWallet, refreshUser } = useAuth()
  const [editingName, setEditingName] = useState(false)

  // Step logic
  let currentStep = 1
  if (isConnected) currentStep = 2
  if (user?.name && user.name.trim().length > 0) currentStep = 3

  // Loading state
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

  // Unified onboarding card
  if (currentStep < 3 || editingName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">Welcome to GOOD CARE Network</CardTitle>
            <CardDescription>Connect your wallet and choose a username to get started</CardDescription>
            <div className="flex justify-center gap-4 mt-4">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <User className="w-6 h-6 mb-1" />
                <span className="text-xs">Connect</span>
                <span className="text-xs">Wallet</span>
                {currentStep > 1 && <CheckCircle className="w-4 h-4 text-green-500 mt-1" />}
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <Badge className="mb-1">@</Badge>
                <span className="text-xs">Set</span>
                <span className="text-xs">Username</span>
                {currentStep > 2 && <CheckCircle className="w-4 h-4 text-green-500 mt-1" />}
              </div>
              <div className={`flex flex-col items-center ${currentStep === 3 ? "text-blue-600" : "text-gray-400"}`}>
                <CheckCircle className="w-6 h-6 mb-1" />
                <span className="text-xs">Ready</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="flex flex-col items-center">
                <WalletConnect />
              </div>
            )}
            {currentStep === 2 && (
              <div className="flex flex-col items-center">
                <UsernamePrompt />
              </div>
            )}
            {currentStep === 3 && editingName && (
              <div className="flex flex-col items-center">
                <UsernamePrompt />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main dashboard after onboarding
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user?.name || "User"}!</h1>
          <p className="text-gray-600">Continue your mental health journey with GOOD CARE Network</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingName(true)}>
              <Edit2 className="w-4 h-4 mr-1" /> Edit Username
            </Button>
            <Button variant="destructive" size="sm" onClick={disconnectWallet}>
              <LogOut className="w-4 h-4 mr-1" /> Disconnect Wallet
            </Button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user?.care_points ?? 0}</p>
              <p className="text-sm text-gray-600">Care Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user?.user_stats?.current_streak ?? 0}</p>
              <p className="text-sm text-gray-600">Current Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user?.user_stats?.longest_streak ?? 0}</p>
              <p className="text-sm text-gray-600">Longest Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user?.user_stats?.total_checkins ?? 0}</p>
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
        </div>
      </div>
    </div>
  )
}
