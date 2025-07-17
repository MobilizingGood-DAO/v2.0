"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Heart, Zap, Crown, Target } from "lucide-react"

interface BadgeDisplayProps {
  carePoints: number
  currentStreak: number
  moodStreak: number
  journalStreak: number
  level: number
}

interface BadgeInfo {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  earned: boolean
  progress?: string
  color: string
}

export function BadgeDisplay({ carePoints, currentStreak, moodStreak, journalStreak, level }: BadgeDisplayProps) {
  const badges: BadgeInfo[] = [
    {
      id: "first-steps",
      name: "First Steps",
      description: "Complete your first check-in",
      icon: <Target className="w-4 h-4" />,
      earned: currentStreak >= 1,
      color: "bg-blue-100 text-blue-800 border-blue-300",
    },
    {
      id: "care-starter",
      name: "CARE Starter",
      description: "Earn your first 50 CARE Points",
      icon: <Star className="w-4 h-4" />,
      earned: carePoints >= 50,
      progress: carePoints < 50 ? `${carePoints}/50` : undefined,
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    {
      id: "care-enthusiast",
      name: "CARE Enthusiast",
      description: "Earn 250 CARE Points",
      icon: <Heart className="w-4 h-4" />,
      earned: carePoints >= 250,
      progress: carePoints < 250 ? `${carePoints}/250` : undefined,
      color: "bg-pink-100 text-pink-800 border-pink-300",
    },
    {
      id: "care-champion",
      name: "CARE Champion",
      description: "Earn 1000 CARE Points",
      icon: <Trophy className="w-4 h-4" />,
      earned: carePoints >= 1000,
      progress: carePoints < 1000 ? `${carePoints}/1000` : undefined,
      color: "bg-purple-100 text-purple-800 border-purple-300",
    },
    {
      id: "streak-warrior",
      name: "Streak Warrior",
      description: "Maintain a 7-day streak",
      icon: <Zap className="w-4 h-4" />,
      earned: currentStreak >= 7,
      progress: currentStreak < 7 ? `${currentStreak}/7 days` : undefined,
      color: "bg-orange-100 text-orange-800 border-orange-300",
    },
    {
      id: "mood-master",
      name: "Mood Master",
      description: "Log mood for 14 consecutive days",
      icon: <Heart className="w-4 h-4" />,
      earned: moodStreak >= 14,
      progress: moodStreak < 14 ? `${moodStreak}/14 days` : undefined,
      color: "bg-red-100 text-red-800 border-red-300",
    },
    {
      id: "gratitude-guru",
      name: "Gratitude Guru",
      description: "Write in journal for 10 consecutive days",
      icon: <Star className="w-4 h-4" />,
      earned: journalStreak >= 10,
      progress: journalStreak < 10 ? `${journalStreak}/10 days` : undefined,
      color: "bg-green-100 text-green-800 border-green-300",
    },
    {
      id: "level-up",
      name: "Level Up",
      description: "Reach Level 5",
      icon: <Crown className="w-4 h-4" />,
      earned: level >= 5,
      progress: level < 5 ? `Level ${level}/5` : undefined,
      color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    },
  ]

  const earnedBadges = badges.filter((badge) => badge.earned)
  const availableBadges = badges.filter((badge) => !badge.earned)

  return (
    <div className="space-y-4">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Earned Badges ({earnedBadges.length})</h3>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => (
              <Badge key={badge.id} className={`${badge.color} flex items-center gap-1`}>
                {badge.icon}
                {badge.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available Badges */}
      {availableBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Badges</h3>
          <div className="space-y-2">
            {availableBadges.slice(0, 3).map((badge) => (
              <div key={badge.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="text-gray-400">{badge.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{badge.name}</div>
                    <div className="text-xs text-gray-500">{badge.description}</div>
                  </div>
                </div>
                {badge.progress && (
                  <Badge variant="outline" className="text-xs">
                    {badge.progress}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
