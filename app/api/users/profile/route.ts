import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { wallet_address, name } = await request.json()

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    let query = supabase.from("users").select("*, user_stats(*)")
    
    query = (query as any).eq("wallet_address", wallet_address.toLowerCase())

    const { data: user, error } = await query.single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error in POST /api/users/profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { wallet_address, name } = await request.json()

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Insert user profile
    const userData: any = {}
    if (wallet_address) {
      userData.wallet_address = wallet_address.toLowerCase()
    }
    if (name) {
      userData.name = name
    }

    // Insert user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert(userData)
      .select()
      .single()

    if (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 })
    }

    // Insert user_stats row for this user
    const { error: statsError } = await supabase
      .from("user_stats")
      .insert({ user_id: user.id })

    if (statsError) {
      console.error("Error creating user_stats:", statsError)
      return NextResponse.json({ success: false, error: statsError.message }, { status: 500 })
    }

    // Return user with stats
    const { data: fullUser, error: fetchError } = await supabase
      .from("users")
      .select("*, user_stats(*)")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching new user with stats:", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: fullUser })
  } catch (error) {
    console.error("Error in PUT /api/users/profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { wallet_address, name } = await request.json()

    if ((!wallet_address) || !name) {
      return NextResponse.json({ success: false, error: "Wallet address and name are required" }, { status: 400 })
    }

    if (name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name cannot be empty" }, { status: 400 })
    }

    let query = supabase
      .from("users")
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .select()

    query = query.eq("wallet_address", wallet_address.toLowerCase())

    const { data: user, error } = await query.single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error in PATCH /api/users/profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
