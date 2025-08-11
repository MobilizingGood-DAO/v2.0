import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { awardPoints } from "@/lib/points-system"

export async function POST(request: NextRequest) {
  try {
    console.log("😊 Mood API called")
    
    const { user_id, wallet_address, mood_score, notes } = await request.json()
    console.log("😊 Request body:", { user_id, wallet_address, mood_score, notes })

    // Validate required fields
    if (!user_id && !wallet_address) {
      console.error("❌ Missing user_id or wallet_address")
      return NextResponse.json({ success: false, error: "User ID or wallet address is required" }, { status: 400 })
    }

    if (mood_score === undefined) {
      console.error("❌ Missing mood_score")
      return NextResponse.json({ success: false, error: "Mood score is required" }, { status: 400 })
    }

    // Validate mood score range
    if (mood_score < 1 || mood_score > 10) {
      console.error("❌ Invalid mood_score:", mood_score)
      return NextResponse.json({ success: false, error: "Mood score must be between 1 and 10" }, { status: 400 })
    }

    // Get user ID if wallet address provided
    let userId = user_id
    if (wallet_address && !user_id) {
      console.log("🔍 Looking up user by wallet address:", wallet_address)
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", wallet_address.toLowerCase())
        .single()
      
      if (userError || !user) {
        console.error("❌ User not found for wallet:", wallet_address)
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      userId = user.id
      console.log("✅ Found user:", userId)
    }

    // Check if user already logged mood today
    const today = new Date().toISOString().split("T")[0]
    console.log("📅 Checking for existing mood entry on:", today)
    
    const { data: existingEntry, error: checkError } = await supabase
      .from("mood_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error checking existing entry:", checkError)
      return NextResponse.json({ success: false, error: "Database error checking existing entry" }, { status: 500 })
    }

    if (existingEntry) {
      console.log("⚠️ User already logged mood today")
      return NextResponse.json({ success: false, error: "You have already logged your mood today" }, { status: 400 })
    }

    console.log("✅ No existing mood entry found, creating new one")

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
      console.error("❌ Error creating mood entry:", moodError)
      return NextResponse.json({ success: false, error: moodError.message }, { status: 500 })
    }

    console.log("✅ Mood entry created:", moodEntry.id)

    // Award points using the unified system
    console.log("🎯 Awarding points for mood activity")
    const pointsResult = await awardPoints(userId, "mood")

    if (!pointsResult.success) {
      console.error("❌ Error awarding points:", pointsResult.error)
      // Don't fail the mood creation, but return the error in response
      return NextResponse.json({
        success: true,
        mood_entry: moodEntry,
        points_awarded: 0,
        streak_days: 0,
        multiplier: 1,
        new_level: 1,
        points_error: pointsResult.error,
        message: "Mood logged successfully, but there was an issue awarding points."
      })
    }

    console.log("🎉 Points awarded successfully:", pointsResult)

    return NextResponse.json({
      success: true,
      mood_entry: moodEntry,
      points_awarded: pointsResult.finalPoints,
      streak_days: pointsResult.streakDays,
      multiplier: pointsResult.multiplier,
      new_level: pointsResult.newLevel,
      message: `Mood logged successfully! You earned ${pointsResult.finalPoints} CARE points.`
    })
  } catch (error) {
    console.error("❌ Mood API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
