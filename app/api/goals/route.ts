import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { awardPoints } from "@/lib/points-system"

// Create Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET: Fetch all goals for a user
export async function GET(request: NextRequest) {
  console.log('🎯 Goals GET API called')
  
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")
    
    console.log('👤 User ID:', user_id)
    
    if (!user_id) {
      console.log('❌ Missing user_id')
      return NextResponse.json({ success: false, error: "Missing user_id" }, { status: 400 })
    }

    console.log('🔍 Fetching goals from database...')

    const { data: goals, error } = await supabaseAdmin
      .from("goals")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error('❌ Goals fetch error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('✅ Goals fetched successfully:', goals?.length || 0, 'goals found')
    return NextResponse.json({ success: true, goals })

  } catch (error) {
    console.error('💥 Unexpected error in Goals GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// POST: Create a new goal and award points
export async function POST(request: NextRequest) {
  console.log('🎯 Goals POST API called')
  
  try {
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { user_id, title, description, category } = body
    
    if (!user_id || !title) {
      console.log('❌ Missing required fields - user_id:', !!user_id, 'title:', !!title)
      return NextResponse.json({ success: false, error: "Missing user_id or title" }, { status: 400 })
    }

    console.log('💾 Creating goal in database...')
    
    const { data: goal, error } = await supabaseAdmin
      .from("goals")
      .insert({ user_id, title, description, category: category || 'general' })
      .select()
      .single()

    if (error) {
      console.error('❌ Goal creation error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('✅ Goal created successfully:', goal.id)

    // Award +10 points for creating a goal
    try {
      console.log('🎁 Awarding points...')
      await awardPoints(user_id, "community", 10)
      console.log('✅ Points awarded successfully')
    } catch (pointsError) {
      console.error('⚠️ Points award failed (but goal was created):', pointsError)
      // Don't fail the whole request if points fail - just log it
    }

    return NextResponse.json({ success: true, goal })

  } catch (error) {
    console.error('💥 Unexpected error in Goals POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// PUT: Update a goal (mark as completed, etc.)
export async function PUT(request: NextRequest) {
  console.log('🎯 Goals PUT API called')
  
  try {
    const body = await request.json()
    const { goal_id, user_id, ...updates } = body
    
    if (!goal_id || !user_id) {
      return NextResponse.json({ success: false, error: "Missing goal_id or user_id" }, { status: 400 })
    }

    console.log('📝 Updating goal:', goal_id, 'for user:', user_id)

    const { data: goal, error } = await supabaseAdmin
      .from("goals")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", goal_id)
      .eq("user_id", user_id) // Ensure user owns this goal
      .select()
      .single()

    if (error) {
      console.error('❌ Goal update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('✅ Goal updated successfully')

    // Award points if goal was completed
    if (updates.is_completed && !updates.completed_at) {
      try {
        console.log('🎁 Awarding completion points...')
        await awardPoints(user_id, "achievement", 25) // More points for completing a goal
        console.log('✅ Completion points awarded')
      } catch (pointsError) {
        console.error('⚠️ Points award failed:', pointsError)
      }
    }

    return NextResponse.json({ success: true, goal })

  } catch (error) {
    console.error('💥 Unexpected error in Goals PUT:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// DELETE: Delete a goal
export async function DELETE(request: NextRequest) {
  console.log('🎯 Goals DELETE API called')
  
  try {
    const { searchParams } = new URL(request.url)
    const goal_id = searchParams.get("goal_id")
    const user_id = searchParams.get("user_id")
    
    if (!goal_id || !user_id) {
      return NextResponse.json({ success: false, error: "Missing goal_id or user_id" }, { status: 400 })
    }

    console.log('🗑️ Deleting goal:', goal_id, 'for user:', user_id)

    const { error } = await supabaseAdmin
      .from("goals")
      .delete()
      .eq("id", goal_id)
      .eq("user_id", user_id) // Ensure user owns this goal

    if (error) {
      console.error('❌ Goal deletion error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('✅ Goal deleted successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('💥 Unexpected error in Goals DELETE:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
