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
    console.log("📝 Journal API called")

    const body = await request.json()
    console.log("📝 Request body:", body)

    const { user_id, content, gratitude_items } = body

    if (!user_id) {
      console.error("❌ Missing user_id")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      console.error("❌ Missing or empty content")
      return NextResponse.json({ error: "Journal content is required" }, { status: 400 })
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

    // Check if user already submitted a journal entry today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingEntry, error: checkError } = await supabase
      .from("journal_entries")
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
    console.log("📝 Is first entry today:", isFirstEntryToday)

    // Calculate points (only for first entry of the day)
    let pointsEarned = 0
    if (isFirstEntryToday) {
      const wordCount = content.trim().split(/\s+/).length
      pointsEarned = 15 // Base points

      // Word count bonus
      if (wordCount >= 100) {
        pointsEarned += 10 // 100+ words bonus
      } else if (wordCount >= 50) {
        pointsEarned += 5 // 50+ words bonus
      }

      console.log(`📝 Points calculation: base=15, wordCount=${wordCount}, total=${pointsEarned}`)
    }

    // Insert or update journal entry
    const journalData = {
      user_id,
      content: content.trim(),
      gratitude_items: gratitude_items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let journalResult
    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from("journal_entries")
        .update({
          content: journalData.content,
          gratitude_items: journalData.gratitude_items,
          updated_at: journalData.updated_at,
        })
        .eq("id", existingEntry.id)
        .select()
        .single()

      journalResult = { data, error }
    } else {
      // Insert new entry
      const { data, error } = await supabase.from("journal_entries").insert(journalData).select().single()

      journalResult = { data, error }
    }

    if (journalResult.error) {
      console.error("❌ Error saving journal entry:", journalResult.error)
      return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 })
    }

    console.log("✅ Journal entry saved:", journalResult.data.id)

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
      entry: journalResult.data,
      pointsEarned,
      isFirstEntryToday,
      message: isFirstEntryToday
        ? `Great reflection! You earned ${pointsEarned} CARE points.`
        : "Thanks for taking the time to reflect!",
    }

    console.log("✅ Journal API response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Journal API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
