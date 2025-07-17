import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        content,
        created_at,
        users!inner(name),
        likes_count,
        comments_count
      `)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error

    const formattedPosts = posts.map((post: any) => ({
      id: post.id,
      content: post.content,
      author_name: post.users.name,
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
    }))

    return NextResponse.json({ success: true, posts: formattedPosts })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    // Get wallet address from headers
    const walletAddress = request.headers.get("x-wallet-address")
    if (!walletAddress) {
      return NextResponse.json({ success: false, error: "Wallet address required" }, { status: 400 })
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if user already posted today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingPost } = await supabase
      .from("community_posts")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", today)
      .lt("created_at", today + "T23:59:59")
      .single()

    if (existingPost) {
      return NextResponse.json({ success: false, error: "You've already posted today!" }, { status: 400 })
    }

    // Create post
    const { error: postError } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      likes_count: 0,
      comments_count: 0,
    })

    if (postError) throw postError

    // Award points
    const pointsEarned = 5
    const newPoints = user.care_points + pointsEarned

    // Update user
    const { error: updateError } = await supabase
      .from("users")
      .update({
        care_points: newPoints,
      })
      .eq("id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      points_earned: pointsEarned,
      new_total: newPoints,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
