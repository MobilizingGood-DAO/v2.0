import { supabase } from "./supabase"

export interface PointsResult {
  success: boolean
  basePoints: number
  streakDays: number
  multiplier: number
  finalPoints: number
  newLevel: number
  error?: string
}

export interface ActivityConfig {
  basePoints: number
  activityType: 'mood' | 'journal' | 'checkin' | 'community'
  maxDaily: number
}

export const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  mood: { basePoints: 10, activityType: 'mood', maxDaily: 1 },
  journal: { basePoints: 15, activityType: 'journal', maxDaily: 1 },
  checkin: { basePoints: 10, activityType: 'checkin', maxDaily: 1 },
  community: { basePoints: 5, activityType: 'community', maxDaily: 3 }
}

export async function awardPoints(
  userId: string,
  activityType: string,
  bonusPoints: number = 0
): Promise<PointsResult> {
  try {
    const config = ACTIVITY_CONFIGS[activityType]
    if (!config) {
      return {
        success: false,
        basePoints: 0,
        streakDays: 0,
        multiplier: 1,
        finalPoints: 0,
        newLevel: 1,
        error: `Unknown activity type: ${activityType}`
      }
    }

    // Check if user already completed this activity today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingActivity } = await supabase
      .from('daily_activities')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', activityType)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .maybeSingle()

    if (existingActivity) {
      return {
        success: false,
        basePoints: 0,
        streakDays: 0,
        multiplier: 1,
        finalPoints: 0,
        newLevel: 1,
        error: `Already completed ${activityType} today`
      }
    }

    // Calculate current streak
    const streakDays = await calculateCurrentStreak(userId)
    
    // Calculate multiplier based on streak
    const multiplier = calculateStreakMultiplier(streakDays)
    
    // Calculate final points
    const basePoints = config.basePoints + bonusPoints
    const finalPoints = Math.floor(basePoints * multiplier)
    
    // Get current user stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    const currentTotalPoints = currentStats?.total_points || 0
    const newTotalPoints = currentTotalPoints + finalPoints
    const newLevel = Math.floor(newTotalPoints / 100) + 1

    // Record the activity
    await supabase.from('daily_activities').insert({
      user_id: userId,
      activity_type: activityType,
      points_earned: finalPoints,
      streak_days: streakDays
    })

    // Update user stats
    await supabase.from('user_stats').upsert({
      user_id: userId,
      total_points: newTotalPoints,
      total_checkins: activityType === 'checkin' ? (currentStats?.total_checkins || 0) + 1 : (currentStats?.total_checkins || 0),
      current_streak: streakDays,
      longest_streak: Math.max(currentStats?.longest_streak || 0, streakDays),
      level: newLevel,
      last_checkin: today,
      updated_at: new Date().toISOString()
    })

    // Update user care points (read-modify-write)
    const { data: user } = await supabase
      .from('users')
      .select('care_points')
      .eq('id', userId)
      .single()
    const currentCarePoints = user?.care_points || 0
    const newCarePoints = currentCarePoints + finalPoints
    await supabase
      .from('users')
      .update({
        care_points: newCarePoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    return {
      success: true,
      basePoints,
      streakDays,
      multiplier,
      finalPoints,
      newLevel
    }
  } catch (error) {
    console.error('Error awarding points:', error)
    return {
      success: false,
      basePoints: 0,
      streakDays: 0,
      multiplier: 1,
      finalPoints: 0,
      newLevel: 1,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function calculateCurrentStreak(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    let currentDate = new Date(today)
    const streakTypes = ['checkin', 'journal']
    let foundToday = false

    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      // Only count checkin/journal activities
      const { data: activity } = await supabase
        .from('daily_activities')
        .select('id')
        .eq('user_id', userId)
        .in('activity_type', streakTypes)
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lt('created_at', `${dateStr}T23:59:59.999Z`)
        .maybeSingle()
      if (activity) {
        streak++
        foundToday = i === 0 ? true : foundToday
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    // If no activity today, streak resets to 1 on next activity
    if (!foundToday) return 1
    return streak || 1
  } catch (error) {
    console.error('Error calculating streak:', error)
    return 1 // Default to 1 if calculation fails
  }
}

function calculateStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.5
  if (streakDays >= 14) return 2.0
  if (streakDays >= 7) return 1.5
  if (streakDays >= 3) return 1.25
  return 1.0
}

export async function getUserStats(userId: string) {
  try {
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return stats || {
      total_points: 0,
      total_checkins: 0,
      current_streak: 0,
      longest_streak: 0,
      level: 1
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      total_points: 0,
      total_checkins: 0,
      current_streak: 0,
      longest_streak: 0,
      level: 1
    }
  }
} 