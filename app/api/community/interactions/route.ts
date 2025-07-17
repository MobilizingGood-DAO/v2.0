import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🎯 === COMMUNITY INTERACTIONS API CALLED ===")

  try {
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("📦 Request body:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { action, post_id, user_id, content, amount } = body

    // Validate required fields
    if (!action) {
      console.error("❌ Missing action field")
      return NextResponse.json({ error: "Missing required field: action" }, { status: 400 })
    }

    if (!post_id) {
      console.error("❌ Missing post_id field")
      return NextResponse.json({ error: "Missing required field: post_id" }, { status: 400 })
    }

    if (!user_id) {
      console.error("❌ Missing user_id field")
      return NextResponse.json({ error: "Missing required field: user_id" }, { status: 400 })
    }

    console.log(`✅ Processing ${action} action for post ${post_id} by user ${user_id}`)

    // Route to appropriate handler
    switch (action) {
      case "like":
        return await handleLike(post_id, user_id)
      case "comment":
        return await handleComment(post_id, user_id, content)
      case "send_care":
        return await handleSendCare(post_id, user_id, amount || 5)
      default:
        console.error("❌ Invalid action:", action)
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("💥 === INTERACTIONS API ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Full error object:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

async function handleLike(post_id: string, user_id: string) {
  console.log("👍 Processing like action...")

  try {
    // Check if user already liked this post
    console.log("🔍 Checking existing like...")
    const { data: existingLike, error: checkError } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user_id)
      .maybeSingle()

    if (checkError) {
      console.error("❌ Error checking existing like:", checkError)
      throw new Error(`Database error checking like: ${checkError.message}`)
    }

    if (existingLike) {
      console.log("👎 Removing existing like...")
      // Unlike the post
      const { error: deleteError } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", user_id)

      if (deleteError) {
        console.error("❌ Error deleting like:", deleteError)
        throw new Error(`Failed to unlike post: ${deleteError.message}`)
      }

      console.log("✅ Post unliked successfully")
      return NextResponse.json({ success: true, action: "unliked" })
    } else {
      console.log("👍 Adding new like...")
      // Like the post
      const { error: insertError } = await supabase.from("post_likes").insert({ post_id, user_id })

      if (insertError) {
        console.error("❌ Error inserting like:", insertError)
        throw new Error(`Failed to like post: ${insertError.message}`)
      }

      console.log("✅ Post liked successfully")
      return NextResponse.json({ success: true, action: "liked" })
    }
  } catch (error) {
    console.error("💥 Like handler error:", error)
    throw error
  }
}

async function handleComment(post_id: string, user_id: string, content: string) {
  console.log("💬 Processing comment action...")

  try {
    if (!content || content.trim().length === 0) {
      console.error("❌ Empty comment content")
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    console.log("📝 Inserting comment...")
    const { data: comment, error: insertError } = await supabase
      .from("post_comments")
      .insert({
        post_id,
        user_id,
        content: content.trim(),
        care_points_earned: 10,
      })
      .select(`
        *,
        users (
          id,
          name,
          username,
          avatar
        )
      `)
      .single()

    if (insertError) {
      console.error("❌ Error inserting comment:", insertError)
      throw new Error(`Failed to create comment: ${insertError.message}`)
    }

    console.log("✅ Comment created successfully:", comment.id)

    // Award care points to commenter
    console.log("💰 Awarding comment points...")
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("care_points")
        .eq("id", user_id)
        .single()

      if (userError) {
        console.error("⚠️ Error fetching user for points:", userError)
      } else {
        const newPoints = (userData.care_points || 0) + 10
        const { error: pointsError } = await supabase.from("users").update({ care_points: newPoints }).eq("id", user_id)

        if (pointsError) {
          console.error("⚠️ Error updating comment points:", pointsError)
        } else {
          console.log("✅ Comment points awarded")
        }
      }
    } catch (pointsError) {
      console.error("💥 Error in points update:", pointsError)
    }

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error("💥 Comment handler error:", error)
    throw error
  }
}

async function handleSendCare(post_id: string, from_user_id: string, amount: number) {
  console.log(`💝 Processing send CARE action: ${amount} points from ${from_user_id} for post ${post_id}`)

  try {
    // Validate amount
    if (!amount || amount <= 0) {
      console.error("❌ Invalid amount:", amount)
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Get post author
    console.log("🔍 Finding post author...")
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", post_id)
      .single()

    if (postError) {
      console.error("❌ Error fetching post:", postError)
      throw new Error(`Post not found: ${postError.message}`)
    }

    const to_user_id = post.user_id
    console.log("👤 Post author:", to_user_id)

    if (from_user_id === to_user_id) {
      console.error("❌ User trying to send CARE to themselves")
      return NextResponse.json({ error: "Cannot send CARE points to yourself" }, { status: 400 })
    }

    // Check if sender has enough points
    console.log("💰 Checking sender balance...")
    const { data: senderData, error: senderError } = await supabase
      .from("users")
      .select("care_points")
      .eq("id", from_user_id)
      .single()

    if (senderError) {
      console.error("❌ Error fetching sender:", senderError)
      throw new Error(`Sender not found: ${senderError.message}`)
    }

    console.log("💰 Sender current points:", senderData.care_points)

    if ((senderData.care_points || 0) < amount) {
      console.error("❌ Insufficient balance:", senderData.care_points, "needed:", amount)
      return NextResponse.json({ error: "Insufficient CARE points" }, { status: 400 })
    }

    // Create transaction record
    console.log("📝 Creating transaction record...")
    const { error: transactionError } = await supabase.from("care_transactions").insert({
      from_user_id,
      to_user_id,
      post_id,
      amount,
      message: `Sent ${amount} CARE points for community post`,
    })

    if (transactionError) {
      console.error("❌ Error creating transaction:", transactionError)
      throw new Error(`Failed to record transaction: ${transactionError.message}`)
    }

    console.log("✅ Transaction recorded")

    // Deduct points from sender
    console.log("💸 Deducting points from sender...")
    const newSenderBalance = senderData.care_points - amount
    const { error: deductError } = await supabase
      .from("users")
      .update({ care_points: newSenderBalance })
      .eq("id", from_user_id)

    if (deductError) {
      console.error("❌ Error deducting points:", deductError)
      throw new Error(`Failed to deduct points: ${deductError.message}`)
    }

    console.log("✅ Points deducted, new sender balance:", newSenderBalance)

    // Add points to recipient
    console.log("💰 Adding points to recipient...")
    const { data: recipientData, error: recipientFetchError } = await supabase
      .from("users")
      .select("care_points")
      .eq("id", to_user_id)
      .single()

    if (recipientFetchError) {
      console.error("❌ Error fetching recipient:", recipientFetchError)
      throw new Error(`Recipient not found: ${recipientFetchError.message}`)
    }

    const newRecipientBalance = (recipientData.care_points || 0) + amount
    const { error: addError } = await supabase
      .from("users")
      .update({ care_points: newRecipientBalance })
      .eq("id", to_user_id)

    if (addError) {
      console.error("❌ Error adding points to recipient:", addError)
      throw new Error(`Failed to add points to recipient: ${addError.message}`)
    }

    console.log("✅ Points added to recipient, new balance:", newRecipientBalance)
    console.log(`🎉 CARE transfer complete: ${amount} points from ${from_user_id} to ${to_user_id}`)

    return NextResponse.json({
      success: true,
      amount_sent: amount,
      sender_new_balance: newSenderBalance,
      recipient_new_balance: newRecipientBalance,
    })
  } catch (error) {
    console.error("💥 Send CARE handler error:", error)
    throw error
  }
}
