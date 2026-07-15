import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Nama kategori wajib diisi." }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("event_categories")
      .update({ name: name.trim() })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, message: "Kategori dengan nama tersebut sudah ada." }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: `Gagal memperbarui kategori: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/categories");
    revalidatePath("/events");
    revalidatePath("/publisher/events/create");
    return NextResponse.json({ success: true, message: "Kategori berhasil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("event_categories")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json({ success: false, message: "Kategori tidak dapat dihapus karena masih digunakan oleh beberapa event." }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: `Gagal menghapus kategori: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/categories");
    revalidatePath("/events");
    revalidatePath("/publisher/events/create");
    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
