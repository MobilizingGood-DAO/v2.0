import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post_id = params.id
    const { user_id } = await request.json()
    if (!user_id || !post_id) {
      return NextResponse.json({ success: false, error: "Missing user_id or post_id" }, { status: 400 })
    }
    // Check if already liked
    const { data: existing, error: likeError } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user_id)
      .single()
    if (likeError && likeError.code !== "PGRST116") throw likeError
    let liked
    if (existing) {
      // Unlike
      const { error: delError } = await supabase
        .from("post_likes")
        .delete()
        .eq("id", existing.id)
      if (delError) throw delError
      liked = false
      // Log unlike
      await supabase.from("daily_activities").insert({
        user_id,
        activity_type: "unlike",
        points_earned: 0,
      })
    } else {
      // Like
      const { error: insError } = await supabase
        .from("post_likes")
        .insert({ post_id, user_id })
      if (insError) throw insError
      liked = true
      // Log like
      await supabase.from("daily_activities").insert({
        user_id,
        activity_type: "like",
        points_earned: 0,
      })
    }
    // Get new like count
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("likes_count")
      .eq("id", post_id)
      .single()
    if (postError) throw postError
    return NextResponse.json({ success: true, liked, likes_count: post.likes_count })
  } catch (error) {
    console.error("Error liking/unliking post:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
} 