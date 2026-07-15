import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Nama kategori wajib diisi." }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("event_categories")
      .insert({ name: name.trim() });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, message: "Kategori dengan nama tersebut sudah ada." }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: `Gagal menambah kategori: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/categories");
    revalidatePath("/events");
    revalidatePath("/publisher/events/create");
    return NextResponse.json({ success: true, message: "Kategori baru berhasil ditambahkan." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
