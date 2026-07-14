"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface ActionResponse {
  success: boolean;
  message: string;
}

/**
 * Membuat event baru oleh Publisher
 */
export async function createEvent(formData: FormData): Promise<ActionResponse> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("category_id") as string;
  const location = formData.get("location") as string;
  const startDateStr = formData.get("start_date") as string;
  const endDateStr = formData.get("end_date") as string;
  const posterFile = formData.get("poster_image") as File;

  if (!title || !categoryId || !startDateStr) {
    return { success: false, message: "Judul, kategori, dan tanggal mulai wajib diisi." };
  }

  try {
    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." };
    }

    let posterImageUrl = "";
    if (posterFile && posterFile.size > 0) {
      posterImageUrl = await uploadToCloudinary(posterFile);
    }

    // Gunakan admin client untuk menulis data demi mem-bypass masalah RLS rekursif
    const supabaseAdmin = await createAdminClient();

    // 2. Masukkan data ke tabel events
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .insert({
        created_by: user.id,
        category_id: categoryId,
        title,
        description,
        location,
        start_date: new Date(startDateStr).toISOString(),
        end_date: endDateStr ? new Date(endDateStr).toISOString() : null,
        poster_image: posterImageUrl || null,
        status: "active", // Default aktif secara operasional
      })
      .select("id")
      .single();

    if (eventError || !event) {
      return { success: false, message: `Gagal membuat event: ${eventError?.message}` };
    }

    // 3. Masukkan status awal 'pending' ke tabel event_approvals
    const { error: approvalError } = await supabaseAdmin
      .from("event_approvals")
      .insert({
        event_id: event.id,
        status: "pending",
      });

    if (approvalError) {
      return { success: false, message: `Event dibuat, tetapi gagal membuat riwayat persetujuan: ${approvalError.message}` };
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/events");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Event berhasil dibuat dan sedang menunggu persetujuan Superadmin." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat membuat event." };
  }
}

/**
 * Mengubah data event oleh Publisher
 */
export async function updateEvent(eventId: string, formData: FormData): Promise<ActionResponse> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("category_id") as string;
  const location = formData.get("location") as string;
  const startDateStr = formData.get("start_date") as string;
  const endDateStr = formData.get("end_date") as string;
  const posterFile = formData.get("poster_image") as File;
  const currentPosterUrl = formData.get("current_poster_image") as string;

  if (!title || !categoryId || !startDateStr) {
    return { success: false, message: "Judul, kategori, dan tanggal mulai wajib diisi." };
  }

  try {
    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." };
    }

    let posterImageUrl = currentPosterUrl;
    if (posterFile && posterFile.size > 0) {
      posterImageUrl = await uploadToCloudinary(posterFile);
    }

    // Gunakan admin client untuk menulis data demi mem-bypass masalah RLS rekursif
    const supabaseAdmin = await createAdminClient();

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
      return { success: false, message: `Gagal memperbarui event: ${error.message}` };
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Event berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui event." };
  }
}

/**
 * Mengubah status operasional event oleh Publisher (active/inactive/deleted)
 */
export async function updateEventStatus(
  eventId: string,
  newStatus: "active" | "inactive" | "deleted"
): Promise<ActionResponse> {
  try {
    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir." };
    }

    // Gunakan admin client untuk menulis data demi mem-bypass masalah RLS rekursif
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from("events")
      .update({ status: newStatus })
      .eq("id", eventId)
      .eq("created_by", user.id);

    if (error) {
      return { success: false, message: `Gagal mengubah status: ${error.message}` };
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

    return { success: true, message: `Event berhasil ${statusLabels[newStatus]}.` };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Memperbarui profil instansi/organisasi Publisher
 */
export async function updatePublisherProfile(formData: FormData): Promise<ActionResponse> {
  const orgName = formData.get("org_name") as string;
  const orgAbbreviation = formData.get("org_abbreviation") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("org_logo") as File;
  const currentLogoUrl = formData.get("current_org_logo") as string;

  if (!orgName) {
    return { success: false, message: "Nama Instansi wajib diisi." };
  }

  try {
    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir." };
    }

    let logoUrl = currentLogoUrl;
    if (logoFile && logoFile.size > 0) {
      logoUrl = await uploadToCloudinary(logoFile);
    }

    // Gunakan admin client untuk menulis data demi mem-bypass masalah RLS rekursif
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        org_name: orgName,
        org_logo: logoUrl || null,
        org_abbreviation: orgAbbreviation || null,
        phone: phone || null,
        address: address || null,
      })
      .eq("user_id", user.id);

    if (error) {
      return { success: false, message: `Gagal memperbarui profil: ${error.message}` };
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/profile");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Profil berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui profil." };
  }
}

/**
 * Menghapus event secara permanen dari database
 */
export async function deleteEventPermanently(eventId: string): Promise<ActionResponse> {
  try {
    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir." };
    }

    // Gunakan admin client untuk bypass RLS
    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("created_by", user.id); // Keamanan: Pastikan hanya pemilik yang bisa menghapus

    if (error) {
      return { success: false, message: `Gagal menghapus event secara permanen: ${error.message}` };
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/events");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Event berhasil dihapus secara permanen." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat menghapus event." };
  }
}
