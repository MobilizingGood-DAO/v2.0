"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Brain, Heart, Target } from "lucide-react"
import Link from "next/link"

export default function Insights() {
  const moodTrends = [
    { period: "This Week", average: 7.2, change: +0.8, trend: "up" },
    { period: "This Month", average: 6.8, change: +0.3, trend: "up" },
    { period: "Last 3 Months", average: 6.5, change: -0.2, trend: "down" },
  ]

  const emotionPatterns = [
    { emotion: "Happy", frequency: 45, change: +12 },
    { emotion: "Calm", frequency: 38, change: +8 },
    { emotion: "Anxious", frequency: 25, change: -15 },
    { emotion: "Grateful", frequency: 42, change: +20 },
    { emotion: "Overwhelmed", frequency: 18, change: -22 },
    { emotion: "Confident", frequency: 35, change: +5 },
  ]

  const goalInsights = [
    {
      goal: "Daily Meditation",
      completion: 85,
      impact: "High positive correlation with mood scores",
      recommendation: "Continue current practice",
    },
    {
      goal: "Gratitude Journal",
      completion: 60,
      impact: "Moderate positive correlation with happiness",
      recommendation: "Try to increase consistency",
    },
    {
      goal: "Exercise",
      completion: 40,
      impact: "Strong positive correlation with energy levels",
      recommendation: "Focus on building this habit",
    },
  ]

  const weeklyPattern = [
    { day: "Mon", mood: 6.2, energy: 5.8 },
    { day: "Tue", mood: 7.1, energy: 6.5 },
    { day: "Wed", mood: 6.8, energy: 6.2 },
    { day: "Thu", mood: 7.5, energy: 7.1 },
    { day: "Fri", mood: 8.2, energy: 7.8 },
    { day: "Sat", mood: 7.9, energy: 7.5 },
    { day: "Sun", mood: 7.3, energy: 6.9 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mental Health Insights</h1>
            <p className="text-gray-600">Understand your emotional patterns and progress</p>
          </div>
        </div>

        {/* Mood Trends */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Mood Trends
            </CardTitle>
            <CardDescription>Your emotional well-being over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {moodTrends.map((trend, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{trend.period}</h3>
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{trend.average}/10</div>
                  <div
                    className={`flex items-center justify-center gap-1 text-sm ${
                      trend.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {trend.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>
                      {trend.change > 0 ? "+" : ""}
                      {trend.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Pattern */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Weekly Patterns
              </CardTitle>
              <CardDescription>Your mood and energy by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyPattern.map((day, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.day}</span>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Mood: {day.mood}/10</span>
                        <span>Energy: {day.energy}/10</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Progress value={day.mood * 10} className="h-2" />
                      <Progress value={day.energy * 10} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emotion Patterns */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Emotion Patterns
              </CardTitle>
              <CardDescription>Most frequent emotions this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emotionPatterns.map((emotion, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{emotion.emotion}</span>
                      <Badge variant={emotion.change > 0 ? "default" : "secondary"} className="text-xs">
                        {emotion.change > 0 ? "+" : ""}
                        {emotion.change}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={emotion.frequency} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-8">{emotion.frequency}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Impact Analysis */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Goal Impact Analysis
            </CardTitle>
            <CardDescription>How your wellness goals affect your mental health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {goalInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{insight.goal}</h3>
                    <Badge variant="outline">{insight.completion}%</Badge>
                  </div>
                  <Progress value={insight.completion} className="h-2" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{insight.impact}</p>
                    <p className="text-xs text-indigo-600 font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights Summary */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Key Insights
            </CardTitle>
            <CardDescription>Personalized observations about your mental health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✨ Positive Trends</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Your mood has improved by 12% this month</li>
                  <li>• Meditation practice shows strong correlation with better days</li>
                  <li>• Anxiety episodes have decreased by 22%</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🎯 Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Focus on building exercise consistency</li>
                  <li>• Consider journaling on weekends for better Sunday mood</li>
                  <li>• Your Thursday routine seems to work well - replicate it</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
