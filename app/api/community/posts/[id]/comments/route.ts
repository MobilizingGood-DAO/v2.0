import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post_id = params.id
    const { data: comments, error } = await supabase
      .from("post_comments")
      .select("id, user_id, content, created_at, users(name)")
      .eq("post_id", post_id)
      .order("created_at", { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post_id = params.id
    const { user_id, content } = await request.json()
    if (!user_id || !content) {
      return NextResponse.json({ success: false, error: "Missing user_id or content" }, { status: 400 })
    }
    // Insert comment
    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({ post_id, user_id, content })
      .select("id, user_id, content, created_at")
      .single()
    if (error) throw error
    // Log comment
    await supabase.from("daily_activities").insert({
      user_id,
      activity_type: "comment",
      points_earned: 0,
    })
    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
} 