import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("category_id") as string;
    const location = formData.get("location") as string;
    const startDateStr = formData.get("start_date") as string;
    const endDateStr = formData.get("end_date") as string;
    const posterFile = formData.get("poster_image") as File;
    const publisherId = formData.get("publisher_id") as string; // Diassign ke publisher terpilih

    if (!title || !categoryId || !startDateStr || !publisherId) {
      return NextResponse.json({ success: false, message: "Judul, kategori, tanggal mulai, dan penyelenggara wajib diisi." }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();

    let posterImageUrl = "";
    if (posterFile && posterFile.size > 0) {
      posterImageUrl = await uploadToCloudinary(posterFile);
    }

    // 1. Masukkan data ke tabel events
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .insert({
        created_by: publisherId,
        category_id: categoryId,
        title,
        description,
        location,
        start_date: new Date(startDateStr).toISOString(),
        end_date: endDateStr ? new Date(endDateStr).toISOString() : null,
        poster_image: posterImageUrl || null,
        status: "active",
      })
      .select("id")
      .single();

    if (eventError || !event) {
      return NextResponse.json({ success: false, message: `Gagal membuat event: ${eventError?.message}` }, { status: 400 });
    }

    // 2. Setujui secara otomatis karena dibuat oleh Superadmin
    const { error: approvalError } = await supabaseAdmin
      .from("event_approvals")
      .insert({
        event_id: event.id,
        status: "approve",
        note: "Dibuat langsung oleh Superadmin",
      });

    if (approvalError) {
      return NextResponse.json({ success: false, message: `Gagal membuat status persetujuan event: ${approvalError.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Event baru berhasil diterbitkan oleh Superadmin." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat membuat event." }, { status: 500 });
  }
}
