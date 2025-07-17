import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get user stats with proper error handling
    const { data: stats, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No stats found, create default stats
        const { data: newStats, error: createError } = await supabase
          .from("user_stats")
          .insert({
            user_id: userId,
            current_streak: 0,
            mood_streak: 0,
            journal_streak: 0,
            total_checkins: 0,
            total_points: 0,
            level: 1,
            longest_streak: 0,
          })
          .select()
          .single()

        if (createError) {
          console.error("❌ Error creating user stats:", createError)
          return NextResponse.json({ error: "Failed to create user stats" }, { status: 500 })
        }

        return NextResponse.json({ stats: newStats })
      }

      console.error("❌ Error fetching user stats:", error)
      return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("❌ Error in stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, activity_type } = await request.json()

    if (!user_id || !activity_type) {
      return NextResponse.json({ error: "User ID and activity type are required" }, { status: 400 })
    }

    const supabase = createClient()

    // Use the RPC function to update stats
    const { data, error } = await supabase.rpc("increment_user_stats", {
      p_user_id: user_id,
      p_activity_type: activity_type,
    })

    if (error) {
      console.error("❌ Error updating user stats:", error)
      return NextResponse.json({ error: "Failed to update user stats" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ Error in stats update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
