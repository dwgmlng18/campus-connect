import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
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
    const publisherId = formData.get("publisher_id") as string;

    if (!title || !categoryId || !startDateStr || !publisherId) {
      return NextResponse.json({ success: false, message: "Judul, kategori, tanggal mulai, dan penyelenggara wajib diisi." }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();

    let posterImageUrl = currentPosterUrl;
    if (posterFile && posterFile.size > 0) {
      posterImageUrl = await uploadToCloudinary(posterFile);
    }

    const { error } = await supabaseAdmin
      .from("events")
      .update({
        created_by: publisherId,
        category_id: categoryId,
        title,
        description,
        location,
        start_date: new Date(startDateStr).toISOString(),
        end_date: endDateStr ? new Date(endDateStr).toISOString() : null,
        poster_image: posterImageUrl || null,
      })
      .eq("id", eventId);

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal memperbarui event: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath(`/superadmin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Event berhasil diperbarui oleh Superadmin." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui event." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal menghapus event secara permanen: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Event berhasil dihapus secara permanen dari sistem." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
