// lib/database.ts - All database operations in one place
import { supabase } from './supabaseClient';

export interface User {
  id: string;
  name?: string;
  wallet_address: string;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  total_checkins: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  last_checkin?: string;
  mood_streak?: number;
  journal_streak?: number;
  updated_at?: string;
}

export interface LeaderboardUser extends User {
  total_points: number;
  total_checkins: number;
  current_streak: number;
  longest_streak: number;
  level: number;
}

// User operations
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return data;
}

export async function createUser(walletAddress: string, name?: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      name: name || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return data;
}

// Stats operations
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting user stats:', error);
    return null;
  }

  return data;
}

export async function createUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error creating user stats:', error);
    return null;
  }

  console.log('✅ Created initial user stats:', data);
  return data;
}

// UPDATED: Proper activity tracking function
export async function recordActivity(
  userId: string, 
  activityType: 'mood' | 'journal' = 'mood', 
  pointsToAdd: number = 10
) {
  try {
    console.log(`📝 Recording ${activityType} activity for user:`, userId);

    // Get current stats
    let stats = await getUserStats(userId);
    
    // Create stats if they don't exist
    if (!stats) {
      console.log('📊 Creating new user stats...');
      stats = await createUserStats(userId);
      if (!stats) return null;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const lastCheckin = stats.last_checkin;
    
    // Calculate if this continues a streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCurrentStreak = 1;
    let shouldIncrementCheckins = true;

    if (lastCheckin) {
      if (lastCheckin === today) {
        // Already checked in today - don't increment checkins but still award points
        newCurrentStreak = stats.current_streak;
        shouldIncrementCheckins = false;
        console.log('⚠️ User already checked in today, but awarding points');
      } else if (lastCheckin === yesterdayStr) {
        // Continuing streak from yesterday
        newCurrentStreak = stats.current_streak + 1;
        console.log('🔥 Streak continues!', newCurrentStreak);
      } else {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
        console.log('💔 Streak broken, starting fresh');
      }
    } else {
      console.log('🎉 First check-in for this user!');
    }

    // Update longest streak if current is longer
    const newLongestStreak = Math.max(newCurrentStreak, stats.longest_streak);
    
    // Calculate new totals
    const newTotalPoints = stats.total_points + pointsToAdd;
    const newTotalCheckins = shouldIncrementCheckins 
      ? stats.total_checkins + 1 
      : stats.total_checkins;
    
    // Calculate new level (every 100 points = next level)
    const newLevel = Math.floor(newTotalPoints / 100) + 1;

    // Prepare update object
    const updateData: any = {
      total_points: newTotalPoints,
      total_checkins: newTotalCheckins,
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      level: newLevel,
      updated_at: new Date().toISOString(),
    };

    // Only update last_checkin if this is a new day
    if (shouldIncrementCheckins) {
      updateData.last_checkin = today;
    }

    // Update activity-specific streaks if columns exist
    if (activityType === 'mood' && stats.mood_streak !== undefined) {
      updateData.mood_streak = shouldIncrementCheckins 
        ? (stats.mood_streak || 0) + 1 
        : stats.mood_streak || 0;
    }
    if (activityType === 'journal' && stats.journal_streak !== undefined) {
      updateData.journal_streak = shouldIncrementCheckins 
        ? (stats.journal_streak || 0) + 1 
        : stats.journal_streak || 0;
    }

    // Update the database
    const { data, error } = await supabase
      .from('user_stats')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user stats:', error);
      return null;
    }

    const result = {
      pointsAdded: pointsToAdd,
      newTotal: newTotalPoints,
      newStreak: newCurrentStreak,
      newLevel: newLevel,
      totalCheckins: newTotalCheckins,
      wasNewDay: shouldIncrementCheckins
    };

    console.log(`✅ Updated ${activityType} stats:`, result);
    return result;

  } catch (error) {
    console.error('❌ Exception in recordActivity:', error);
    return null;
  }
}

// UPDATED: Use the new recordActivity function
export async function addPoints(userId: string, points: number): Promise<number | null> {
  const result = await recordActivity(userId, 'mood', points);
  return result ? result.pointsAdded : null;
}

// New function for mood submissions
export async function submitMoodEntry(userId: string, moodData: any, pointsToAdd: number = 10) {
  try {
    console.log('🎭 Submitting mood entry for user:', userId);

    // Record the activity and update stats
    const activityResult = await recordActivity(userId, 'mood', pointsToAdd);
    
    if (!activityResult) {
      console.error('❌ Failed to record mood activity');
      return null;
    }

    return {
      success: true,
      pointsAdded: activityResult.pointsAdded,
      newTotal: activityResult.newTotal,
      newStreak: activityResult.newStreak,
      totalCheckins: activityResult.totalCheckins,
      wasNewDay: activityResult.wasNewDay
    };

  } catch (error) {
    console.error('❌ Error in submitMoodEntry:', error);
    return null;
  }
}

// New function for journal submissions  
export async function submitJournalEntry(userId: string, journalData: any, pointsToAdd: number = 15) {
  try {
    console.log('📝 Submitting journal entry for user:', userId);

    // Record the activity and update stats
    const activityResult = await recordActivity(userId, 'journal', pointsToAdd);
    
    if (!activityResult) {
      console.error('❌ Failed to record journal activity');
      return null;
    }

    return {
      success: true,
      pointsAdded: activityResult.pointsAdded,
      newTotal: activityResult.newTotal,
      newStreak: activityResult.newStreak,
      totalCheckins: activityResult.totalCheckins,
      wasNewDay: activityResult.wasNewDay
    };

  } catch (error) {
    console.error('❌ Error in submitJournalEntry:', error);
    return null;
  }
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardUser[]> {
  try {
    // Try the join query first
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        wallet_address,
        created_at,
        user_stats!inner (
          total_points,
          total_checkins,
          current_streak,
          longest_streak,
          level
        )
      `)
      .order('user_stats(total_points)', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('⚠️ Join query failed, trying alternative approach:', error.message);
      
      // Alternative approach: separate queries
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select(`
          user_id,
          total_points,
          total_checkins,
          current_streak,
          longest_streak,
          level,
          users (
            id,
            name,
            wallet_address,
            created_at
          )
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (statsError) {
        console.error('❌ Error fetching leaderboard (alternative):', statsError);
        return [];
      }

      return statsData.map(stat => ({
        id: stat.users.id,
        name: stat.users.name,
        wallet_address: stat.users.wallet_address,
        created_at: stat.users.created_at,
        total_points: stat.total_points,
        total_checkins: stat.total_checkins,
        current_streak: stat.current_streak,
        longest_streak: stat.longest_streak,
        level: stat.level,
      }));
    }

    return data.map(user => ({
      id: user.id,
      name: user.name,
      wallet_address: user.wallet_address,
      created_at: user.created_at,
      total_points: user.user_stats[0].total_points,
      total_checkins: user.user_stats[0].total_checkins,
      current_streak: user.user_stats[0].current_streak,
      longest_streak: user.user_stats[0].longest_streak,
      level: user.user_stats[0].level,
    }));

  } catch (error) {
    console.error('❌ Exception in getLeaderboard:', error);
    return [];
  }
}

// Debug function to test the tracking
export async function testUserActivity(userId: string) {
  console.log('🧪 Testing activity tracking for user:', userId);
  
  // Test mood submission
  const moodResult = await submitMoodEntry(userId, { mood: 'happy' }, 10);
  console.log('Mood test result:', moodResult);
  
  // Get updated stats
  const updatedStats = await getUserStats(userId);
  console.log('Updated user stats:', updatedStats);
  
  return { moodResult, updatedStats };
}
