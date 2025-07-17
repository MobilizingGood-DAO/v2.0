import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { awardPoints } from "@/lib/points-system"

export async function POST(request: NextRequest) {
  try {
    console.log("=== CHECK-IN API CALLED ===")

    const body = await request.json()
    const { user_id, mood_score, emotions = [], notes = "", gratitude = "", public_gratitude = false } = body

    console.log("Received check-in data:", {
      user_id,
      mood_score,
      emotions: emotions.length,
      notes: notes.length,
      gratitude: gratitude.length,
      public_gratitude,
    })

    // Validate required fields
    if (!user_id) {
      console.error("Missing user_id")
      return NextResponse.json({ error: "Missing required field: user_id" }, { status: 400 })
    }

    if (!mood_score) {
      console.error("Missing mood_score")
      return NextResponse.json({ error: "Missing required field: mood_score" }, { status: 400 })
    }

    // Validate mood_score range
    if (mood_score < 1 || mood_score > 10) {
      console.error("Invalid mood_score:", mood_score)
      return NextResponse.json({ error: "mood_score must be between 1 and 10" }, { status: 400 })
    }

    console.log("Validation passed, proceeding with database operations...")

    // Calculate care points
    let points = 10 // Base points
    if (emotions.length > 0) points += 5
    if (notes.trim().length > 0) points += 10
    if (gratitude.trim().length > 0) points += 15
    if (public_gratitude) points += 15

    const today = new Date().toISOString().split("T")[0]

    // Get current user stats to calculate streak
    console.log("Fetching current user stats...")
    const { data: currentStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user_id)
      .single()

    if (statsError && statsError.code !== "PGRST116") {
      console.error("Error fetching user stats:", statsError)
      return NextResponse.json(
        {
          error: "Failed to fetch user stats",
          details: statsError.message,
        },
        { status: 500 },
      )
    }

    console.log("Current stats:", currentStats)

    let current_streak = 1
    if (currentStats && currentStats.last_checkin) {
      const lastDate = new Date(currentStats.last_checkin)
      const todayDate = new Date(today)
      const diffTime = todayDate.getTime() - lastDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        current_streak = currentStats.current_streak + 1
      } else if (diffDays === 0) {
        // Same day, keep current streak
        current_streak = currentStats.current_streak
      } else {
        // Streak broken
        current_streak = 1
      }
    }

    // Create mood label
    const moodLabels = [
      "Terrible",
      "Very Bad",
      "Bad",
      "Poor",
      "Okay",
      "Good",
      "Very Good",
      "Great",
      "Excellent",
      "Amazing",
    ]
    const mood_label = moodLabels[mood_score - 1]

    console.log("Attempting to insert/update daily check-in with data:", {
      user_id,
      date: today,
      mood: mood_score,
      mood_label,
      notes: notes.trim(),
      gratitude_note: gratitude.trim(),
      points,
      streak: current_streak,
      resources_viewed: emotions,
    })

    // Insert or update daily check-in
    const { data: checkin, error: checkinError } = await supabase
      .from("daily_checkins")
      .upsert(
        {
          user_id,
          date: today,
          mood: mood_score,
          mood_label,
          notes: notes.trim(),
          gratitude_note: gratitude.trim(),
          points,
          streak: current_streak,
          resources_viewed: emotions,
        },
        {
          onConflict: "user_id,date",
        },
      )
      .select()
      .single()

    if (checkinError) {
      console.error("Check-in insertion error:", {
        error: checkinError,
        code: checkinError.code,
        message: checkinError.message,
        details: checkinError.details,
        hint: checkinError.hint,
      })
      return NextResponse.json(
        {
          error: "Failed to save check-in",
          details: checkinError.message,
          code: checkinError.code,
        },
        { status: 500 },
      )
    }

    console.log("Check-in saved successfully:", checkin)

    // Award points and update stats using the unified helper
    const pointsResult = await awardPoints(user_id, "checkin")
    if (!pointsResult.success) {
      console.error("Error awarding points:", pointsResult.error)
      // Don't fail the check-in, just log the error
    }

    // Check for badge eligibility
    const badgeEligible = await checkBadgeEligibility(user_id, current_streak)

    // If public gratitude, create a care objective entry
    if (public_gratitude && gratitude.trim()) {
      const { data: user } = await supabase.from("users").select("username, name").eq("id", user_id).single()

      await supabase.from("care_objectives").insert({
        username: user?.username || user?.name || "Anonymous",
        description: gratitude.trim(),
        points: 15,
      })
    }

    console.log("Check-in completed successfully")

    return NextResponse.json({
      success: true,
      checkin,
      care_points_earned: pointsResult.finalPoints,
      current_streak: pointsResult.streakDays,
      badge_eligible: badgeEligible,
    })
  } catch (error) {
    console.error("=== CHECK-IN API ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Full error object:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

async function checkBadgeEligibility(user_id: string, streak: number) {
  const milestones = [7, 14, 30, 60, 100]
  const eligibleBadges = []

  for (const milestone of milestones) {
    if (streak >= milestone) {
      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from("badges")
        .select("id")
        .eq("user_id", user_id)
        .eq("badge_type", `streak_${milestone}`)
        .single()

      if (!existingBadge) {
        eligibleBadges.push({
          type: `streak_${milestone}`,
          title: `${milestone} Day Streak`,
          description: `Completed ${milestone} consecutive days of check-ins`,
        })
      }
    }
  }

  return eligibleBadges
}
