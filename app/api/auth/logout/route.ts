import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true, message: "Logout berhasil!", redirectTo: "/login" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Gagal melakukan logout." }, { status: 500 });
  }
}
