"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const moodEmojis = [
  { score: 1, emoji: "😢", label: "Very Sad" },
  { score: 2, emoji: "😞", label: "Sad" },
  { score: 3, emoji: "😕", label: "Down" },
  { score: 4, emoji: "😐", label: "Neutral" },
  { score: 5, emoji: "🙂", label: "Okay" },
  { score: 6, emoji: "😊", label: "Good" },
  { score: 7, emoji: "😄", label: "Happy" },
  { score: 8, emoji: "😁", label: "Very Happy" },
  { score: 9, emoji: "🤗", label: "Excited" },
  { score: 10, emoji: "🥳", label: "Euphoric" },
]

export default function MoodTrackerPage() {
  const { user, refreshUser } = useAuth()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async () => {
    if (!user || selectedMood === null) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/mood/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          mood_score: selectedMood,
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Mood logged successfully! +10 points earned." })
        setSelectedMood(null)
        setNotes("")
        await refreshUser()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to log mood" })
      }
    } catch (error) {
      console.error("Error creating mood entry:", error)
      setMessage({ type: "error", text: "Failed to log mood. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Please connect your wallet to track your mood.</p>
              <Link href="/">
                <Button className="mt-4">Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Mood Tracker</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {moodEmojis.map((mood) => (
                <button
                  key={mood.score}
                  onClick={() => setSelectedMood(mood.score)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedMood === mood.score
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">{mood.emoji}</div>
                  <div className="text-xs text-gray-600">{mood.label}</div>
                  <div className="text-xs font-medium text-gray-800">{mood.score}</div>
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling? What's on your mind?"
                rows={4}
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <Button onClick={handleSubmit} disabled={selectedMood === null || isSubmitting} className="w-full">
              {isSubmitting ? "Logging Mood..." : "Log Mood"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
