import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { awardPoints } from "@/lib/points-system"

export async function POST(request: NextRequest) {
  try {
    const { user_id, wallet_address, mood_score, notes } = await request.json()

    // Validate required fields
    if (!user_id && !wallet_address) {
      return NextResponse.json({ success: false, error: "User ID or wallet address is required" }, { status: 400 })
    }

    if (mood_score === undefined) {
      return NextResponse.json({ success: false, error: "Mood score is required" }, { status: 400 })
    }

    // Validate mood score range
    if (mood_score < 1 || mood_score > 10) {
      return NextResponse.json({ success: false, error: "Mood score must be between 1 and 10" }, { status: 400 })
    }

    // Get user ID if wallet address provided
    let userId = user_id
    if (wallet_address && !user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", wallet_address.toLowerCase())
        .single()
      
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      userId = user.id
    }

    // Check if user already logged mood today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingEntry } = await supabase
      .from("mood_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .single()

    if (existingEntry) {
      return NextResponse.json({ success: false, error: "You have already logged your mood today" }, { status: 400 })
    }

    // Create mood entry
    const { data: moodEntry, error: moodError } = await supabase
      .from("mood_entries")
      .insert({
        user_id: userId,
        mood_score,
        notes: notes || null,
      })
      .select()
      .single()

    if (moodError) {
      console.error("Error creating mood entry:", moodError)
      return NextResponse.json({ success: false, error: moodError.message }, { status: 500 })
    }

    // Award points using the unified system
    const pointsResult = await awardPoints(userId, "mood")

    if (!pointsResult.success) {
      console.error("Error awarding points:", pointsResult.error)
      // Don't fail the mood creation, just log the error
    }

    return NextResponse.json({
      success: true,
      mood_entry: moodEntry,
      points_awarded: pointsResult.finalPoints,
      streak_days: pointsResult.streakDays,
      multiplier: pointsResult.multiplier,
      new_level: pointsResult.newLevel,
    })
  } catch (error) {
    console.error("Mood API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
