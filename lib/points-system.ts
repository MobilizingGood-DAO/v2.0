// lib/points-system.ts - Updated points system with proper tracking
import { supabase } from "@/lib/supabase";

export interface PointsResult {
  success: boolean;
  error?: string;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  newTotal: number;
  streakDays: number;
  newLevel: number;
  totalCheckins: number;
  longestStreak: number;
}

export async function awardPoints(userId: string, activityType: 'mood' | 'journal' = 'mood'): Promise<PointsResult> {
  try {
    console.log(`🎯 Awarding points for ${activityType} to user:`, userId);

    // Get or create user stats
    let { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching user stats:', statsError);
      return {
        success: false,
        error: statsError.message,
        basePoints: 0,
        multiplier: 1,
        finalPoints: 0,
        newTotal: 0,
        streakDays: 0,
        newLevel: 1,
        totalCheckins: 0,
        longestStreak: 0
      };
    }

    // Create stats if they don't exist
    if (!stats) {
      console.log('📊 Creating new user stats for user:', userId);
      const { data: newStats, error: createError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_points: 0,
          total_checkins: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 1,
          mood_streak: 0,
          journal_streak: 0,
          last_checkin: null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user stats:', createError);
        return {
          success: false,
          error: createError.message,
          basePoints: 0,
          multiplier: 1,
          finalPoints: 0,
          newTotal: 0,
          streakDays: 0,
          newLevel: 1,
          totalCheckins: 0,
          longestStreak: 0
        };
      }

      stats = newStats;
    }

    // Calculate base points based on activity type
    const basePoints = activityType === 'journal' ? 15 : 10;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = stats.last_checkin;
    
    // Calculate streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCurrentStreak = 1;
    let shouldIncrementCheckins = true;

    if (lastCheckin) {
      if (lastCheckin === today) {
        // Already checked in today - unusual since API should prevent this
        newCurrentStreak = stats.current_streak;
        shouldIncrementCheckins = false;
        console.log('⚠️ User already has activity today (unusual)');
      } else if (lastCheckin === yesterdayStr) {
        // Continuing streak from yesterday
        newCurrentStreak = stats.current_streak + 1;
        console.log('🔥 Streak continues! Day', newCurrentStreak);
      } else {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
        console.log('💔 Streak broken, starting fresh');
      }
    } else {
      console.log('🎉 First activity for this user!');
    }

    // Calculate streak multiplier (bonus for streaks)
    let multiplier = 1;
    if (newCurrentStreak >= 7) {
      multiplier = 2; // 2x points for week+ streaks
    } else if (newCurrentStreak >= 3) {
      multiplier = 1.5; // 1.5x points for 3+ day streaks
    }

    // Calculate final points with multiplier
    const finalPoints = Math.floor(basePoints * multiplier);
    
    // Update longest streak if current is longer
    const newLongestStreak = Math.max(newCurrentStreak, stats.longest_streak);
    
    // Calculate new totals
    const newTotalPoints = stats.total_points + finalPoints;
    const newTotalCheckins = shouldIncrementCheckins 
      ? stats.total_checkins + 1 
      : stats.total_checkins;
    
    // Calculate new level (every 100 points = next level)
    const newLevel = Math.floor(newTotalPoints / 100) + 1;

    // Prepare update object
    const updateData: any = {
      total_points: newTotalPoints,
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      level: newLevel,
      updated_at: new Date().toISOString(),
    };

    // Only update these if it's a new day
    if (shouldIncrementCheckins) {
      updateData.total_checkins = newTotalCheckins;
      updateData.last_checkin = today;
    }

    // Update activity-specific streaks
    if (activityType === 'mood' && shouldIncrementCheckins) {
      updateData.mood_streak = (stats.mood_streak || 0) + 1;
    }
    if (activityType === 'journal' && shouldIncrementCheckins) {
      updateData.journal_streak = (stats.journal_streak || 0) + 1;
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('user_stats')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating user stats:', updateError);
      return {
        success: false,
        error: updateError.message,
        basePoints,
        multiplier,
        finalPoints: 0,
        newTotal: stats.total_points,
        streakDays: stats.current_streak,
        newLevel: stats.level,
        totalCheckins: stats.total_checkins,
        longestStreak: stats.longest_streak
      };
    }

    const result = {
      success: true,
      basePoints,
      multiplier,
      finalPoints,
      newTotal: newTotalPoints,
      streakDays: newCurrentStreak,
      newLevel,
      totalCheckins: newTotalCheckins,
      longestStreak: newLongestStreak
    };

    console.log(`✅ Points awarded successfully:`, {
      activity: activityType,
      pointsAwarded: finalPoints,
      newTotal: newTotalPoints,
      streak: newCurrentStreak,
      level: newLevel,
      totalCheckins: newTotalCheckins
    });

    return result;

  } catch (error) {
    console.error('❌ Exception in awardPoints:', error);
    return {
      success: false,
      error: 'Internal error awarding points',
      basePoints: 0,
      multiplier: 1,
      finalPoints: 0,
      newTotal: 0,
      streakDays: 0,
      newLevel: 1,
      totalCheckins: 0,
      longestStreak: 0
    };
  }
}

// Backward compatibility function if you have other code using addPoints
export async function addPoints(userId: string, points: number): Promise<number | null> {
  const result = await awardPoints(userId, 'mood');
  return result.success ? result.finalPoints : null;
}

// Helper function to get current user stats
export async function getCurrentUserStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting user stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting user stats:', error);
    return null;
  }
}

// Debug function to check what's happening
export async function debugUserStats(userId: string) {
  console.log('🔍 Debugging user stats for:', userId);
  
  const stats = await getCurrentUserStats(userId);
  console.log('Current stats:', stats);
  
  if (!stats) {
    console.log('No stats found - they will be created on next activity');
    return;
  }
  
  console.log('📊 Stats breakdown:', {
    totalPoints: stats.total_points,
    totalCheckins: stats.total_checkins,
    currentStreak: stats.current_streak,
    longestStreak: stats.longest_streak,
    level: stats.level,
    lastCheckin: stats.last_checkin,
    moodStreak: stats.mood_streak,
    journalStreak: stats.journal_streak
  });
}
