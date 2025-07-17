import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Create a single instance
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Also export the createClient function for specific use cases
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Database types
export interface User {
  id: string
  wallet_address?: string
  twitter_username?: string
  twitter_name?: string
  twitter_avatar_url?: string
  care_points: number
  self_care_points?: number
  care_objective_points?: number
  current_streak?: number
  longest_streak?: number
  created_at: string
  updated_at: string
}

export interface UserStats {
  id: string
  user_id: string
  current_streak: number
  mood_streak: number
  journal_streak: number
  total_checkins: number
  total_points: number
  level: number
  longest_streak: number
  last_checkin?: string
  updated_at: string
}

export interface MoodEntry {
  id: string
  user_id: string
  mood_score: number
  notes?: string
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  is_public: boolean
  created_at: string
}

export interface CommunityPost {
  id: string
  user_id: string
  content: string
  type: string
  care_points: number
  created_at: string
}
