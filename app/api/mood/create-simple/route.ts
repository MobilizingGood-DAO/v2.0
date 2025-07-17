import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

function calculateStreak(entries: any[]): number {
  if (!entries || entries.length === 0) return 1

  const sortedEntries = entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  let streak = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)

    const hasEntryOnDate = sortedEntries.some((entry) => {
      const entryDate = new Date(entry.created_at)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === checkDate.getTime()
    })

    if (hasEntryOnDate) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function getStreakMultiplier(streak: number): number {
  if (streak <= 2) return 1.0
  if (streak <= 6) return 1.25
  if (streak <= 13) return 1.5
  return 2.0
}

export async function POST(request: NextRequest) {
  try {
    console.log("😊 Mood API called")

    const body = await request.json()
    console.log("😊 Request body:", body)

    const { user_id, mood, energy, notes } = body

    if (!user_id) {
      console.error("❌ Missing user_id")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!mood || mood < 1 || mood > 5) {
      console.error("❌ Invalid mood value:", mood)
      return NextResponse.json({ error: "Valid mood rating (1-5) is required" }, { status: 400 })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, care_points")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      console.error("❌ User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ User found:", user.id)

    // Check if user already submitted a mood entry today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingEntry, error: checkError } = await supabase
      .from("mood_entries")
      .select("id, created_at")
      .eq("user_id", user_id)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error checking existing entry:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const isFirstEntryToday = !existingEntry
    console.log("😊 Is first entry today:", isFirstEntryToday)

    // Calculate points (only for first entry of the day)
    const pointsEarned = isFirstEntryToday ? 10 : 0
    console.log(`😊 Points earned: ${pointsEarned}`)

    // Insert or update mood entry
    const moodData = {
      user_id,
      mood,
      energy: energy || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let moodResult
    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from("mood_entries")
        .update({
          mood: moodData.mood,
          energy: moodData.energy,
          notes: moodData.notes,
          updated_at: moodData.updated_at,
        })
        .eq("id", existingEntry.id)
        .select()
        .single()

      moodResult = { data, error }
    } else {
      // Insert new entry
      const { data, error } = await supabase.from("mood_entries").insert(moodData).select().single()

      moodResult = { data, error }
    }

    if (moodResult.error) {
      console.error("❌ Error saving mood entry:", moodResult.error)
      return NextResponse.json({ error: "Failed to save mood entry" }, { status: 500 })
    }

    console.log("✅ Mood entry saved:", moodResult.data.id)

    // Award points only for first entry of the day
    if (isFirstEntryToday && pointsEarned > 0) {
      const newTotal = (user.care_points || 0) + pointsEarned

      const { error: pointsError } = await supabase
        .from("users")
        .update({
          care_points: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id)

      if (pointsError) {
        console.error("❌ Error updating points:", pointsError)
        // Don't fail the request if points update fails
      } else {
        console.log(`✅ Points awarded: ${pointsEarned}, new total: ${newTotal}`)
      }
    }

    const response = {
      success: true,
      entry: moodResult.data,
      pointsEarned,
      isFirstEntryToday,
      message: isFirstEntryToday
        ? `Thanks for checking in! You earned ${pointsEarned} CARE points.`
        : "Thanks for taking good care of yourself!",
    }

    console.log("✅ Mood API response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Mood API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
