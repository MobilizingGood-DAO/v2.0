import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post_id = params.id
    const { tipper_id, amount } = await request.json()
    if (!tipper_id || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Missing or invalid tipper_id or amount" }, { status: 400 })
    }
    // Get post and author
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", post_id)
      .single()
    if (postError || !post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }
    const author_id = post.user_id
    if (author_id === tipper_id) {
      return NextResponse.json({ success: false, error: "You cannot tip yourself" }, { status: 400 })
    }
    // Get tipper and author balances
    const { data: tipper, error: tipperError } = await supabase
      .from("users")
      .select("care_points")
      .eq("id", tipper_id)
      .single()
    if (tipperError || !tipper) {
      return NextResponse.json({ success: false, error: "Tipper not found" }, { status: 404 })
    }
    if (tipper.care_points < amount) {
      return NextResponse.json({ success: false, error: "Insufficient CARE points" }, { status: 400 })
    }
    const { data: author, error: authorError } = await supabase
      .from("users")
      .select("care_points")
      .eq("id", author_id)
      .single()
    if (authorError || !author) {
      return NextResponse.json({ success: false, error: "Author not found" }, { status: 404 })
    }
    // Transfer points
    const { error: tipperUpdateError } = await supabase
      .from("users")
      .update({ care_points: tipper.care_points - amount })
      .eq("id", tipper_id)
    if (tipperUpdateError) throw tipperUpdateError
    const { error: authorUpdateError } = await supabase
      .from("users")
      .update({ care_points: author.care_points + amount })
      .eq("id", author_id)
    if (authorUpdateError) throw authorUpdateError
    // Log transaction
    const { error: txError } = await supabase
      .from("care_transactions")
      .insert({ from_user_id: tipper_id, to_user_id: author_id, post_id, amount })
    if (txError) throw txError
    // Log tip
    await supabase.from("daily_activities").insert({
      user_id: tipper_id,
      activity_type: "tip",
      points_earned: 0,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tipping post:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
} 