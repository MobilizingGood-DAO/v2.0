import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get public care objectives (gratitude entries)
    const { data: careObjectives, error: careError } = await supabase
      .from("care_objectives")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (careError) {
      console.error("Care objectives query error:", careError)
      return NextResponse.json({ error: "Failed to fetch care objectives" }, { status: 500 })
    }

    // Get public gratitude from daily check-ins
    const { data: gratitudeEntries, error: gratitudeError } = await supabase
      .from("daily_checkins")
      .select(`
        id,
        gratitude_note,
        created_at,
        points,
        users!inner (
          id,
          name,
          username,
          avatar
        )
      `)
      .not("gratitude_note", "is", null)
      .neq("gratitude_note", "")
      .order("created_at", { ascending: false })
      .range(0, 10) // Get some recent gratitude entries

    // Combine both types of entries
    const feed = [
      ...(careObjectives || []).map((entry) => ({
        id: `care_${entry.id}`,
        content: entry.description,
        author: {
          name: entry.username,
          username: entry.username,
          avatar: "/placeholder.svg?height=40&width=40",
        },
        care_points: entry.points,
        created_at: entry.created_at,
        type: "care_objective",
      })),
      ...(gratitudeEntries || []).map((entry) => ({
        id: `gratitude_${entry.id}`,
        content: entry.gratitude_note,
        author: {
          name: entry.users.name || entry.users.username || "Anonymous",
          username: entry.users.username || "anonymous",
          avatar: entry.users.avatar || "/placeholder.svg?height=40&width=40",
        },
        care_points: entry.points,
        created_at: entry.created_at,
        type: "gratitude",
      })),
    ]

    // Sort by created_at
    feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      feed: feed.slice(0, limit),
      has_more: feed.length === limit,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
