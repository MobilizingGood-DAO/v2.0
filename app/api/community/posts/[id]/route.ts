import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    const { data: post, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        content,
        care_points_earned,
        created_at,
        likes_count,
        comments_count,
        users!inner (
          id,
          name,
          username,
          avatar,
          wallet_address
        )
      `)
      .eq("id", postId)
      .single()

    if (error) {
      console.error("❌ Error fetching post:", error)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        care_points: post.care_points_earned,
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        author: {
          id: post.users.id,
          name: post.users.name || post.users.username || "Anonymous",
          username: post.users.username || "user",
          avatar: post.users.avatar,
          wallet_address: post.users.wallet_address,
        },
      },
    })
  } catch (error) {
    console.error("💥 API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
