"use client"

import { useAuth } from "@/hooks/useAuth"
import { WalletConnect } from "@/components/wallet-connect"
import { UsernamePrompt } from "@/components/username-prompt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, Users, Trophy, Zap, Calendar, CheckCircle, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HomePage() {
  const { user, isConnected, isLoading } = useAuth()
  const [step, setStep] = useState(1)

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
          {currentStep === 3 && user && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-lg font-semibold text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Welcome, {user.name}!
              </div>
              <Link href="/community">
                <Button className="w-full">Continue to Community</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
