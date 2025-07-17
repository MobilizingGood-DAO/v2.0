import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Average mood score (all-time)
    const { data: moodAll, error: moodAllError } = await supabase
      .from("mood_entries")
      .select("score")
    if (moodAllError) throw moodAllError
    const allScores = (moodAll || []).map((m: any) => m.score)
    const avgMoodAll = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) : null

    // Average mood score (today)
    const today = new Date().toISOString().split("T")[0]
    const { data: moodToday, error: moodTodayError } = await supabase
      .from("mood_entries")
      .select("score")
      .gte("created_at", today)
      .lt("created_at", today + "T23:59:59")
    if (moodTodayError) throw moodTodayError
    const todayScores = (moodToday || []).map((m: any) => m.score)
    const avgMoodToday = todayScores.length > 0 ? (todayScores.reduce((a, b) => a + b, 0) / todayScores.length) : null

    // Number of check-ins today
    const { count: checkinsToday, error: checkinError } = await supabase
      .from("checkin")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today)
      .lt("created_at", today + "T23:59:59")
    if (checkinError) throw checkinError

    // Total goals set
    const { count: totalGoals, error: goalsError } = await supabase
      .from("goals")
      .select("id", { count: "exact", head: true })
    if (goalsError) throw goalsError

    return NextResponse.json({
      success: true,
      avgMoodAll,
      avgMoodToday,
      checkinsToday: checkinsToday || 0,
      totalGoals: totalGoals || 0,
    })
  } catch (error) {
    console.error("Error fetching insights:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
} 