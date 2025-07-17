"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ArrowLeft, BookOpen, Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import GratitudeMintModal from "@/components/gratitude-mint-modal"

export default function JournalPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showMintModal, setShowMintModal] = useState(false)
  const [lastJournalContent, setLastJournalContent] = useState("")
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/journal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          title: title.trim() || "Journal Entry",
          content: content.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setMessage(`Journal saved! You earned ${data.points_earned || 15} CARE points! 🎉`)
        setLastJournalContent(content.trim())
        await refreshUser()

        // Show mint modal after 1.5 seconds
        setTimeout(() => {
          setShowMintModal(true)
        }, 1500)
      } else {
        setIsSuccess(false)
        setMessage(data.error || "Failed to save journal entry")
      }
    } catch (error) {
      console.error("Error creating journal entry:", error)
      setIsSuccess(false)
      setMessage("Failed to save journal entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMintClose = () => {
    setShowMintModal(false)
    setTimeout(() => {
      router.push("/")
    }, 500)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Daily Journal
            </CardTitle>
            <CardDescription className="text-gray-600">
              Write about your thoughts and experiences. Earn 15 CARE points (once per day)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <div
                className={`p-4 rounded-lg border ${
                  isSuccess ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  {isSuccess && <Sparkles className="h-5 w-5 mr-2" />}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  maxLength={100}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Your thoughts *
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind today? How are you feeling? What are you grateful for?"
                  className="min-h-[200px] resize-none"
                  maxLength={2000}
                  required
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{content.length}/2000 characters</span>
                  <span>{wordCount} words</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry & Earn 15 CARE Points"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500 bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="font-medium mb-1 text-purple-700">🔗 Optional On-Chain Storage</div>
              <div className="text-purple-600">
                After saving, you can mint a hash of your entry on the GOOD CARE blockchain.
              </div>
            </div>
          </CardContent>
        </Card>

        <GratitudeMintModal
          isOpen={showMintModal}
          onClose={handleMintClose}
          journalContent={lastJournalContent}
          userId={user.id}
        />
      </div>
    </div>
  )
}
