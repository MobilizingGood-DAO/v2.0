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
}

export interface LeaderboardUser extends User {
  total_points: number;
  total_checkins: number;
  current_streak: number;
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

  if (error) {
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user stats:', error);
    return null;
  }

  return data;
}

export async function addPoints(userId: string, points: number): Promise<number | null> {
  const stats = await getUserStats(userId);
  if (!stats) {
    console.warn('No stats found for user:', userId);
    return null;
  }

  const { data, error } = await supabase
    .from('user_stats')
    .update({
      total_points: stats.total_points + points,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('total_points')
    .single();

  if (error) {
    console.error('Error adding points:', error);
    return null;
  }

  console.log(`✅ Added ${points} points. New total:`, data.total_points);
  return points;
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardUser[]> {
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
        level
      )
    `)
    .order('user_stats(total_points)', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data.map(user => ({
    id: user.id,
    name: user.name,
    wallet_address: user.wallet_address,
    created_at: user.created_at,
    total_points: user.user_stats[0].total_points,
    total_checkins: user.user_stats[0].total_checkins,
    current_streak: user.user_stats[0].current_streak,
    level: user.user_stats[0].level,
  }));
}
