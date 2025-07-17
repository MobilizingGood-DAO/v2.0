"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"

export function DebugMood() {
  const { user, addCarePoints } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const testMoodSubmission = async () => {
    if (!user) {
      setResult("❌ No user connected")
      return
    }

    setIsLoading(true)
    setResult("🔄 Testing mood submission...")

    try {
      const response = await fetch("/api/mood/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          mood_score: 4,
          notes: "Debug test mood entry",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(`✅ Success! Earned ${data.points_earned} CARE points. New total: ${data.new_total}`)
        addCarePoints(data.points_earned)
      } else {
        setResult(`❌ Failed: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectPointsAdd = async () => {
    if (!user) {
      setResult("❌ No user connected")
      return
    }

    setIsLoading(true)
    setResult("🔄 Testing direct points addition...")

    try {
      const pointsAdded = await addCarePoints(5)
      if (pointsAdded) {
        setResult(`✅ Successfully added ${pointsAdded} points directly`)
      } else {
        setResult("❌ Failed to add points directly")
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Debug Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Please connect your wallet first</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>CARE Points:</strong> {user.care_points || 0}
          </div>
          <div>
            <strong>Wallet:</strong> {user.wallet_address?.slice(0, 10)}...
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={testMoodSubmission} disabled={isLoading} className="w-full">
            Test Mood Submission
          </Button>

          <Button
            onClick={testDirectPointsAdd}
            disabled={isLoading}
            variant="outline"
            className="w-full bg-transparent"
          >
            Test Direct Points Add
          </Button>
        </div>

        {result && <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono">{result}</div>}
      </CardContent>
    </Card>
  )
}
