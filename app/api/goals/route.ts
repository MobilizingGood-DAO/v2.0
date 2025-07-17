import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { awardPoints } from "@/lib/points-system"

// GET: Fetch all goals for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")
    if (!user_id) {
      return NextResponse.json({ success: false, error: "Missing user_id" }, { status: 400 })
    }
    const { data: goals, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, goals })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new goal and award points
export async function POST(request: NextRequest) {
  try {
    const { user_id, title, description, category } = await request.json()
    if (!user_id || !title) {
      return NextResponse.json({ success: false, error: "Missing user_id or title" }, { status: 400 })
    }
    const { data: goal, error } = await supabase
      .from("goals")
      .insert({ user_id, title, description, category })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    // Award +10 points for creating a goal
    await awardPoints(user_id, "community", 10)
    return NextResponse.json({ success: true, goal })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
} 