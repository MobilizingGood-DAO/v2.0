import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { awardPoints } from "@/lib/points-system"

export async function POST(request: NextRequest) {
  try {
    const { user_id, wallet_address, title, content } = await request.json()

    if (!user_id && !wallet_address) {
      return NextResponse.json({ error: "User ID or wallet address is required" }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
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
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      userId = user.id
    }

    // Check if user already has a journal entry today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingEntry } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .maybeSingle()

    if (existingEntry) {
      return NextResponse.json({
        success: false,
        error: "You've already journaled today! Come back tomorrow for more CARE points.",
      })
    }

    // Create journal entry
    const { data: journalEntry, error: journalError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: userId,
        title: title || "Journal Entry",
        content,
      })
      .select()
      .single()

    if (journalError) {
      console.error("Error creating journal entry:", journalError)
      return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 })
    }

    // Award points using the unified system
    const pointsResult = await awardPoints(userId, "journal")

    if (!pointsResult.success) {
      console.error("Error awarding points:", pointsResult.error)
      // Don't fail the journal creation, just log the error
    }

    return NextResponse.json({
      success: true,
      entry: journalEntry,
      points_earned: pointsResult.finalPoints,
      streak_days: pointsResult.streakDays,
      multiplier: pointsResult.multiplier,
      new_level: pointsResult.newLevel,
    })
  } catch (error) {
    console.error("Error in journal API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
