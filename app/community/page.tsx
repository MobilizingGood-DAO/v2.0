"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Heart, MessageCircle, Send, Target, BarChart2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface CommunityPost {
  id: string
  content: string
  author_name: string
  created_at: string
  likes_count: number
  comments_count: number
}

interface Goal {
  id: string
  title: string
  description: string
  category: string
  created_at: string
}

const TABS = [
  { key: "feed", label: "Feed", icon: <Users className="w-4 h-4 mr-1" /> },
  { key: "goals", label: "Goals", icon: <Target className="w-4 h-4 mr-1" /> },
  { key: "insights", label: "Insights", icon: <BarChart2 className="w-4 h-4 mr-1" /> },
]

export default function Community() {
  const [activeTab, setActiveTab] = useState("feed")
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPost, setNewPost] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState<string | null>(null)
  const [likeLoading, setLikeLoading] = useState<string | null>(null)
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [openTipPostId, setOpenTipPostId] = useState<string | null>(null)
  const [tipAmount, setTipAmount] = useState("")
  const [tipLoading, setTipLoading] = useState(false)
  const { user, refreshUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      if (activeTab === "feed") loadPosts()
      if (activeTab === "goals") loadGoals()
      if (activeTab === "insights") loadInsights()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab])

  if (!user) {
    router.push("/")
    return null
  }

  const loadPosts = async () => {
    setIsLoadingPosts(true)
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const loadGoals = async () => {
    setIsLoadingGoals(true)
    try {
      const response = await fetch(`/api/goals?user_id=${user.id}`)
      const data = await response.json()
      if (data.success) {
        setGoals(data.goals)
      }
    } catch (error) {
      console.error("Error loading goals:", error)
    } finally {
      setIsLoadingGoals(false)
    }
  }

  const loadInsights = async () => {
    setIsLoadingInsights(true)
    setInsightsError(null)
    try {
      const response = await fetch("/api/community/insights")
      const data = await response.json()
      if (data.success) {
        setInsights(data)
      } else {
        setInsightsError(data.error || "Failed to load insights")
      }
    } catch (error) {
      setInsightsError("Failed to load insights")
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) return

    setIsLoading(true)
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user.wallet_address) {
        headers["x-wallet-address"] = user.wallet_address
      }
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: newPost.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        await refreshUser()
        setNewPost("")
        await loadPosts()
        alert(`Post shared! You earned ${data.points_earned} CARE points!`)
      } else {
        alert(data.error || "Failed to share post")
      }
    } catch (error) {
      console.error("Error sharing post:", error)
      alert("Failed to share post")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareGoal = async (goalId: string) => {
    setShareLoading(goalId)
    try {
      const response = await fetch("/api/community/share-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: goalId, user_id: user.id }),
      })
      const data = await response.json()
      if (data.success) {
        await refreshUser()
        alert(`Goal shared to community! You earned ${data.points_earned} CARE points!`)
        setActiveTab("feed")
        await loadPosts()
      } else {
        alert(data.error || "Failed to share goal")
      }
    } catch (error) {
      alert("Failed to share goal")
    } finally {
      setShareLoading(null)
    }
  }

  const handleLike = async (postId: string) => {
    setLikeLoading(postId)
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await response.json()
      if (data.success) {
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: data.likes_count } : p))
      }
    } catch {}
    setLikeLoading(null)
  }

  const openComments = async (postId: string) => {
    setOpenCommentsPostId(postId)
    setCommentsLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      const data = await response.json()
      if (data.success) setComments(data.comments)
      else setComments([])
    } catch { setComments([]) }
    setCommentsLoading(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setCommentSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${openCommentsPostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, content: newComment.trim() }),
      })
      const data = await response.json()
      if (data.success) {
        setComments((prev) => [...prev, { ...data.comment, users: { name: user.name } }])
        setPosts((prev) => prev.map((p) => p.id === openCommentsPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
        setNewComment("")
      }
    } catch {}
    setCommentSubmitting(false)
  }

  const openTip = (postId: string) => {
    setOpenTipPostId(postId)
    setTipAmount("")
  }

  const handleTip = async () => {
    if (!tipAmount || isNaN(Number(tipAmount)) || Number(tipAmount) <= 0) return
    setTipLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${openTipPostId}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipper_id: user.id, amount: Number(tipAmount) }),
      })
      const data = await response.json()
      if (data.success) {
        await refreshUser()
        alert("Tip sent!")
        setOpenTipPostId(null)
      } else {
        alert(data.error || "Failed to tip")
      }
    } catch { alert("Failed to tip") }
    setTipLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1"
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "feed" && (
            <>
              {/* Create Post */}
              <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Share with the Community
                  </CardTitle>
                  <CardDescription>Share your thoughts and earn 5 CARE points (once per day)</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                      placeholder="What's on your mind? Share your wellness journey, tips, or encouragement..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="border-emerald-200 focus:border-emerald-400 min-h-[100px]"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={!newPost.trim() || isLoading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isLoading ? "Sharing..." : "Share Post & Earn Points"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              {/* Community Posts */}
              <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
                <CardHeader>
                  <CardTitle>Community Feed</CardTitle>
                  <CardDescription>See what others are sharing</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPosts ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-600">Be the first to share something with the community!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{post.author_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {new Date(post.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-3">{post.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button
                              className={`flex items-center gap-1 ${likeLoading === post.id ? "opacity-50" : "hover:text-red-500"}`}
                              onClick={() => handleLike(post.id)}
                              disabled={likeLoading === post.id}
                            >
                              <Heart className="w-4 h-4" />
                              <span>{post.likes_count}</span>
                            </button>
                            <button
                              className="flex items-center gap-1 hover:text-blue-500"
                              onClick={() => openComments(post.id)}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments_count}</span>
                            </button>
                            <button
                              className="flex items-center gap-1 hover:text-yellow-500"
                              onClick={() => openTip(post.id)}
                            >
                              💸 <span>Tip</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Comments Modal */}
              <Dialog open={!!openCommentsPostId} onOpenChange={() => setOpenCommentsPostId(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                  </DialogHeader>
                  {commentsLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                      {comments.length === 0 ? (
                        <div className="text-gray-500 text-center">No comments yet.</div>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="p-2 bg-gray-100 rounded">
                            <span className="font-medium">{c.users?.name || "User"}</span>
                            <span className="ml-2 text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                            <div>{c.content}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      disabled={commentSubmitting}
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={commentSubmitting || !newComment.trim()}>
                      {commentSubmitting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Tip Modal */}
              <Dialog open={!!openTipPostId} onOpenChange={() => setOpenTipPostId(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tip CARE Points</DialogTitle>
                  </DialogHeader>
                  <div className="mb-4">Enter amount to tip:</div>
                  <Input
                    type="number"
                    min="1"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Amount"
                    disabled={tipLoading}
                  />
                  <DialogFooter>
                    <Button onClick={handleTip} disabled={tipLoading || !tipAmount || isNaN(Number(tipAmount)) || Number(tipAmount) <= 0}>
                      {tipLoading ? "Tipping..." : "Send Tip"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {activeTab === "goals" && (
            <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
              <CardHeader>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>Track your wellness goals and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingGoals ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
                    <p className="text-gray-600">Set your first goal to start your journey!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{goal.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(goal.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-1">{goal.description}</p>
                        <div className="text-xs text-gray-500 mb-2">Category: {goal.category || "General"}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={shareLoading === goal.id}
                          onClick={() => handleShareGoal(goal.id)}
                          className="mt-2"
                        >
                          {shareLoading === goal.id ? "Sharing..." : "Share to Community"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "insights" && (
            <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
              <CardHeader>
                <CardTitle>Community Insights</CardTitle>
                <CardDescription>See how the community is doing</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="text-center text-gray-500 py-8">Loading insights...</div>
                ) : insightsError ? (
                  <div className="text-center text-red-500 py-8">{insightsError}</div>
                ) : insights ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Average Mood (Today)</div>
                      <div className="text-2xl font-bold text-emerald-700">{insights.avgMoodToday !== null ? insights.avgMoodToday.toFixed(2) : "-"}</div>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Average Mood (All-Time)</div>
                      <div className="text-2xl font-bold text-cyan-700">{insights.avgMoodAll !== null ? insights.avgMoodAll.toFixed(2) : "-"}</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Check-ins Today</div>
                      <div className="text-2xl font-bold text-purple-700">{insights.checkinsToday}</div>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Goals Set</div>
                      <div className="text-2xl font-bold text-pink-700">{insights.totalGoals}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">No insights available.</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
