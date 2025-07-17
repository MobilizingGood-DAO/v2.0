import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🏆 Leaderboard API called")

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all-time"
    const category = searchParams.get("category") || "overall"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    console.log("📊 Fetching leaderboard data with params:", { period, category, limit })

    // Get users with their care points, ordered by points
    const { data: leaderboardData, error } = await supabase
      .from("users")
      .select(`
        id,
        wallet_address,
        username,
        name,
        avatar,
        care_points,
        updated_at
      `)
      .not("care_points", "is", null)
      .order("care_points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Leaderboard query error:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    console.log(`✅ Fetched ${leaderboardData?.length || 0} users for leaderboard`)

    // Get user stats separately for better performance
    const userIds = leaderboardData?.map((user) => user.id) || []
    const userStatsMap = new Map()

    if (userIds.length > 0) {
      const { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .in("user_id", userIds)

      if (statsError) {
        console.error("⚠️ Error fetching user stats:", statsError)
        // Continue without stats
      } else {
        statsData?.forEach((stat) => {
          userStatsMap.set(stat.user_id, stat)
        })
      }
    }

    // Format leaderboard data with real-time care points
    let leaderboard = (leaderboardData || []).map((user, index) => {
      const stats = userStatsMap.get(user.id) || {}
      return {
        rank: index + 1,
        id: user.id,
        name: user.name || user.username || `User ${user.id.slice(0, 8)}`,
        handle: user.username ? `@${user.username}` : `@user${user.id.slice(0, 8)}`,
        avatar: user.avatar || "/placeholder.svg?height=40&width=40",
        points: user.care_points || 0, // Use real-time care_points from users table
        streak: stats.current_streak || 0,
        level: stats.level || 1,
        total_checkins: stats.total_checkins || 0,
        longest_streak: stats.longest_streak || 0,
        mood_streak: stats.mood_streak || 0,
        journal_streak: stats.journal_streak || 0,
        last_activity: stats.last_checkin || user.updated_at,
      }
    })

    // Apply category-specific sorting
    if (category === "streak") {
      leaderboard.sort((a, b) => {
        if (b.streak !== a.streak) return b.streak - a.streak
        return b.points - a.points // Tie-breaker
      })
    } else if (category === "checkins") {
      leaderboard.sort((a, b) => {
        if (b.total_checkins !== a.total_checkins) return b.total_checkins - a.total_checkins
        return b.points - a.points // Tie-breaker
      })
    } else if (category === "mood_streak") {
      leaderboard.sort((a, b) => {
        if (b.mood_streak !== a.mood_streak) return b.mood_streak - a.mood_streak
        return b.points - a.points // Tie-breaker
      })
    } else if (category === "journal_streak") {
      leaderboard.sort((a, b) => {
        if (b.journal_streak !== a.journal_streak) return b.journal_streak - a.journal_streak
        return b.points - a.points // Tie-breaker
      })
    }
    // Default is already sorted by care_points (real-time)

    // Re-assign ranks after sorting
    leaderboard.forEach((user, index) => {
      user.rank = index + 1
    })

    // Apply period filtering if needed
    if (period !== "all-time") {
      const dateFilter = new Date()
      if (period === "today") {
        dateFilter.setHours(0, 0, 0, 0)
      } else if (period === "week") {
        dateFilter.setDate(dateFilter.getDate() - 7)
      } else if (period === "month") {
        dateFilter.setMonth(dateFilter.getMonth() - 1)
      }

      // Filter users who have been active in the period
      leaderboard = leaderboard.filter((user) => user.last_activity && new Date(user.last_activity) >= dateFilter)

      // Re-rank after filtering
      leaderboard.forEach((user, index) => {
        user.rank = index + 1
      })
    }

    console.log(`🏆 Returning ${leaderboard.length} users in leaderboard`)

    return NextResponse.json({
      success: true,
      leaderboard,
      period,
      category,
      total_users: leaderboard.length,
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Leaderboard API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
