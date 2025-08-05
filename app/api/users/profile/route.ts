import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Type for expected JSON body
interface UserPayload {
  wallet_address: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { wallet_address }: UserPayload = await request.json();

    if (!wallet_address) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*, user_stats(*)")
      .eq("wallet_address", wallet_address.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("POST /api/users/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { wallet_address, name }: UserPayload = await request.json();

    if (!wallet_address) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const newUserPayload: any = {
      wallet_address: wallet_address.toLowerCase(),
    };

    if (name) newUserPayload.name = name;

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert(newUserPayload)
      .select()
      .single();

    if (userError) {
      console.error("Insert user error:", userError);
      return NextResponse.json(
        { success: false, error: userError.message },
        { status: 500 }
      );
    }

    // Insert related user_stats
    const { error: statsError } = await supabase
      .from("user_stats")
      .insert({ user_id: user.id });

    if (statsError) {
      console.error("Insert user_stats error:", statsError);
      return NextResponse.json(
        { success: false, error: statsError.message },
        { status: 500 }
      );
    }

    // Fetch full user with user_stats
    const { data: fullUser, error: fetchError } = await supabase
      .from("users")
      .select("*, user_stats(*)")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Refetch error:", fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: fullUser });
  } catch (error) {
    console.error("PUT /api/users/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { wallet_address, name }: UserPayload = await request.json();

    if (!wallet_address || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Wallet address and valid name are required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", wallet_address.toLowerCase())
      .select("*, user_stats(*)")
      .single();

    if (error) {
      console.error("Update user error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("PATCH /api/users/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
