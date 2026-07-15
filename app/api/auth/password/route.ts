import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: "Password minimal harus 6 karakter." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password Anda berhasil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui password." }, { status: 500 });
  }
}
