"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { web3Service } from "@/lib/web3"

interface UseInteractionsProps {
  postId: string
  initialLikes?: number
  initialComments?: number
  onChain?: boolean // Toggle between on-chain and off-chain
}

export function useCommunityInteractions({
  postId,
  initialLikes = 0,
  initialComments = 0,
  onChain = false,
}: UseInteractionsProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikes)
  const [commentsCount, setCommentsCount] = useState(initialComments)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    if (!user || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/community/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "like",
          post_id: postId,
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.action === "liked") {
          setIsLiked(true)
          setLikesCount((prev) => prev + 1)
        } else {
          setIsLiked(false)
          setLikesCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComment = async (content: string) => {
    if (!user || !content.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/community/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCommentsCount((prev) => prev + 1)

        if (onChain) {
          // Award points on-chain (optional, if you want to keep this logic)
          try {
            // If you want to keep on-chain logic, you can add it here
            // Otherwise, do nothing and let backend handle points
          } catch (error) {
            console.error("❌ On-chain reward failed:", error)
            // Fallback: do nothing, backend will handle points
          }
        }
        // No direct addCarePoints here; backend handles all point updates

        return data.comment
      }
    } catch (error) {
      console.error("Error commenting:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCare = async (amount = 5) => {
    if (!user || isLoading) return

    console.log("🚀 Sending CARE to post:", postId)
    console.log("👤 User object:", user)
    console.log("📦 Payload will be:", {
      action: "send_care",
      post_id: postId,
      user_id: user.id,
      amount,
    })

    setIsLoading(true)
    try {
      const response = await fetch("/api/community/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_care",
          post_id: postId,
          user_id: user.id,
          amount,
        }),
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response ok:", response.ok)

      const data = await response.json()
      console.log("📡 Response data:", data)

      if (data.success) {
        // No direct addCarePoints(-amount); backend handles all point updates
        return true
      } else {
        console.error("❌ API returned error:", data.error)
        alert(data.error || "Failed to send CARE points")
        return false
      }
    } catch (error) {
      console.error("💥 Network/Parse error:", error)
      alert(error instanceof Error ? error.message : "Failed to send CARE points")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLiked,
    likesCount,
    commentsCount,
    isLoading,
    handleLike,
    handleComment,
    handleSendCare,
  }
}
