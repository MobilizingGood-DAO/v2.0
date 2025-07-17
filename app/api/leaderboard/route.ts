import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Try to get users with user_stats first
    let { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        wallet_address,
        care_points,
        user_stats (
          current_streak,
          longest_streak,
          total_checkins,
          total_points,
          level
        )
      `)
      .order("care_points", { ascending: false })
      .limit(50)

    // If that fails, try without user_stats
    if (error) {
      console.log("Failed to fetch with user_stats, trying without:", error)
      const { data: usersWithoutStats, error: error2 } = await supabase
        .from("users")
        .select(`
          id,
          name,
          wallet_address,
          care_points
        `)
        .order("care_points", { ascending: false })
        .limit(50)

      if (error2) {
        console.error("Error fetching leaderboard:", error2)
        return NextResponse.json({ success: false, error: error2.message }, { status: 500 })
      }

      // Add default user_stats structure
      users = usersWithoutStats?.map((user: any) => ({
        ...user,
        user_stats: {
          current_streak: 0,
          longest_streak: 0,
          total_checkins: 0,
          total_points: 0,
          level: 1
        }
      })) || []
    }

    if (!users) {
      return NextResponse.json({ success: true, leaderboard: [] })
    }

    // Filter out users without names and format the data
    const leaderboard = (users as any[])
      .filter((user) => user.name && user.name.trim().length > 0)
      .map((user, index) => {
        const userStats = Array.isArray(user.user_stats) ? user.user_stats[0] : user.user_stats
        return {
          rank: index + 1,
          id: user.id,
          name: user.name,
          wallet_address: user.wallet_address,
          care_points: user.care_points || 0,
          current_streak: userStats?.current_streak || 0,
          longest_streak: userStats?.longest_streak || 0,
          total_checkins: userStats?.total_checkins || 0,
        }
      })

    return NextResponse.json({ success: true, leaderboard })
  } catch (error) {
    console.error("Leaderboard API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
