import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("category_id") as string;
    const location = formData.get("location") as string;
    const startDateStr = formData.get("start_date") as string;
    const endDateStr = formData.get("end_date") as string;
    const posterFile = formData.get("poster_image") as File;
    const currentPosterUrl = formData.get("current_poster_image") as string;

    if (!title || !categoryId || !startDateStr || !endDateStr || !description) {
      return NextResponse.json({ success: false, message: "Judul, kategori, tanggal mulai, tanggal selesai, dan deskripsi wajib diisi." }, { status: 400 });
    }

    if (new Date(endDateStr) <= new Date(startDateStr)) {
      return NextResponse.json({ success: false, message: "Tanggal selesai kegiatan harus setelah tanggal mulai kegiatan." }, { status: 400 });
    }

    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    let posterImageUrl = currentPosterUrl;
    if (posterFile && posterFile.size > 0) {
      posterImageUrl = await uploadToCloudinary(posterFile);
    }

    // Gunakan admin client untuk menulis data demi mem-bypass RLS
    const supabaseAdmin = await createAdminClient();

    // Ambil data event saat ini untuk membandingkan judul event
    const { data: currentEvent, error: fetchError } = await supabaseAdmin
      .from("events")
      .select("title")
      .eq("id", eventId)
      .single();

    if (fetchError || !currentEvent) {
      return NextResponse.json({ success: false, message: "Event tidak ditemukan." }, { status: 404 });
    }

    const isTitleChanged = currentEvent.title !== title;

    const { error } = await supabaseAdmin
      .from("events")
      .update({
        category_id: categoryId,
        title,
        description,
        location,
        start_date: new Date(startDateStr).toISOString(),
        end_date: endDateStr ? new Date(endDateStr).toISOString() : null,
        poster_image: posterImageUrl || null,
      })
      .eq("id", eventId)
      .eq("created_by", user.id); // Keamanan: Pastikan hanya pemilik yang bisa mengubah

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal memperbarui event: ${error.message}` }, { status: 400 });
    }

    // Jika judul/nama event diubah oleh publisher, kembalikan statusnya menjadi pending
    if (isTitleChanged) {
      const { error: approvalError } = await supabaseAdmin
        .from("event_approvals")
        .insert({
          event_id: eventId,
          status: "pending",
          note: "Judul event diubah oleh publisher, memerlukan persetujuan ulang.",
        });

      if (approvalError) {
        return NextResponse.json({ success: false, message: `Event diperbarui, tetapi gagal mereset status persetujuan: ${approvalError.message}` }, { status: 400 });
      }
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Event berhasil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui event." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    const { status } = await request.json();

    if (!status || !["active", "inactive", "deleted"].includes(status)) {
      return NextResponse.json({ success: false, message: "Status tidak valid." }, { status: 400 });
    }

    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
    }

    // Gunakan admin client untuk menulis data demi mem-bypass RLS
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from("events")
      .update({ status })
      .eq("id", eventId)
      .eq("created_by", user.id);

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal mengubah status: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    const statusLabels = {
      active: "diaktifkan kembali",
      inactive: "dinonaktifkan sementara",
      deleted: "dihapus",
    };

    return NextResponse.json({ success: true, message: `Event berhasil ${statusLabels[status as keyof typeof statusLabels]}.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
    }

    // Gunakan admin client untuk bypass RLS
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("created_by", user.id); // Keamanan: Pastikan hanya pemilik yang bisa menghapus

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal menghapus event secara permanen: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/events");
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Event berhasil dihapus secara permanen." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat menghapus event." }, { status: 500 });
  }
}
