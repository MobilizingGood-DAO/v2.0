import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { goal_id, user_id } = await request.json()
    if (!goal_id || !user_id) {
      return NextResponse.json({ success: false, error: "Missing goal_id or user_id" }, { status: 400 })
    }
    // Fetch the goal
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select("title, description")
      .eq("id", goal_id)
      .eq("user_id", user_id)
      .single()
    if (goalError || !goal) {
      return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 })
    }
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, care_points")
      .eq("id", user_id)
      .single()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    // Check how many goals user has shared today
    const today = new Date().toISOString().split("T")[0]
    const { data: sharedToday, error: sharedTodayError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("user_id", user_id)
      .eq("type", "goal_share")
      .gte("created_at", today)
      .lt("created_at", today + "T23:59:59")
    if (sharedTodayError) throw sharedTodayError
    const sharedCount = sharedToday ? sharedToday.length : 0
    if (sharedCount >= 2) {
      // Allow sharing, but no points
      // Insert post with type 'goal_share' (if not already set)
      const { error: postError } = await supabase.from("community_posts").insert({
        user_id,
        content: goal.title + (goal.description ? ": " + goal.description : ""),
        type: "goal_share",
        likes_count: 0,
        comments_count: 0,
      })
      if (postError) throw postError
      return NextResponse.json({
        success: true,
        points_earned: 0,
        points_awarded: false,
        message: "You have reached the daily points limit for shared goals."
      })
    }
    // Create a community post
    const content = `Goal: ${goal.title}\n${goal.description || ""}`
    const { error: postError } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      likes_count: 0,
      comments_count: 0,
    })
    if (postError) throw postError
    // Award points for sharing a goal
    const pointsEarned = 3
    const newPoints = user.care_points + pointsEarned
    const { error: updateError } = await supabase
      .from("users")
      .update({ care_points: newPoints })
      .eq("id", user.id)
    if (updateError) throw updateError
    return NextResponse.json({ success: true, points_earned: pointsEarned, new_total: newPoints })
  } catch (error) {
    console.error("Error sharing goal to feed:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
} 