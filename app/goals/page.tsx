"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Check, Calendar, Bell, Coins, Trophy, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export default function Goals() {
  const { user, refreshUser } = useAuth()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "",
  })

  const categories = ["Mindfulness", "Journaling", "Physical Health", "Learning", "Social", "Sleep", "Nutrition"]

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/goals?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGoals(data.goals)
        else setError(data.error || "Failed to load goals")
      })
      .catch(() => setError("Failed to load goals"))
      .finally(() => setLoading(false))
  }, [user])

  const addGoal = async () => {
    if (!user || !newGoal.title) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: newGoal.title,
          description: newGoal.description,
          category: newGoal.category,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGoals([data.goal, ...goals])
        setNewGoal({ title: "", description: "", category: "" })
        setShowAddGoal(false)
        refreshUser && refreshUser()
      } else {
        setError(data.error || "Failed to add goal")
      }
    } catch {
      setError("Failed to add goal")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please connect your wallet to manage goals.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Wellness Goals
            </h1>
            <p className="text-gray-600">Create and track your real wellness goals</p>
          </div>
          <Button onClick={() => setShowAddGoal(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading goals...</div>
        ) : (
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center text-gray-500">No goals yet. Add your first goal!</div>
            ) : (
              goals.map((goal) => (
                <Card key={goal.id} className="bg-white/80 backdrop-blur-sm border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{goal.category}</Badge>
                      <span className="text-xs text-gray-500">Created: {new Date(goal.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        {showAddGoal && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-emerald-200">
            <CardHeader>
              <CardTitle>Add New Goal</CardTitle>
              <CardDescription>Create a new wellness objective</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Goal Title</div>
                <Input
                  placeholder="e.g., Daily Meditation"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Category</div>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Description</div>
                <Input
                  placeholder="Describe your goal..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={addGoal} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600">
                  Add Goal
                </Button>
                <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
