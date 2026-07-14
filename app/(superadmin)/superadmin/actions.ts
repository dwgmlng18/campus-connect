"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface ActionResponse {
  success: boolean;
  message: string;
}

/**
 * Menyetujui pendaftaran akun Publisher
 */
export async function approvePublisher(publisherId: string): Promise<ActionResponse> {
  try {
    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("users")
      .update({ status: "approve", reject_reason: null })
      .eq("id", publisherId);

    if (error) {
      return { success: false, message: `Gagal menyetujui akun: ${error.message}` };
    }

    // Perbarui metadata auth user
    await supabaseAdmin.auth.admin.updateUserById(publisherId, {
      user_metadata: { status: "approve" }
    });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    return { success: true, message: "Akun publisher berhasil disetujui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Menolak pendaftaran akun Publisher
 */
export async function rejectPublisher(publisherId: string, reason: string): Promise<ActionResponse> {
  if (!reason || reason.trim().length === 0) {
    return { success: false, message: "Alasan penolakan wajib diisi." };
  }

  try {
    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("users")
      .update({ status: "reject", reject_reason: reason })
      .eq("id", publisherId);

    if (error) {
      return { success: false, message: `Gagal menolak akun: ${error.message}` };
    }

    // Perbarui metadata auth user
    await supabaseAdmin.auth.admin.updateUserById(publisherId, {
      user_metadata: { status: "reject" }
    });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    return { success: true, message: "Pendaftaran akun publisher telah ditolak." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Menyetujui pengajuan Event Kampus
 */
export async function approveEvent(eventId: string, note?: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir." };
    }

    const supabaseAdmin = await createAdminClient();

    // Tambahkan record persetujuan baru
    const { error } = await supabaseAdmin
      .from("event_approvals")
      .insert({
        event_id: eventId,
        status: "approve",
        note: note || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, message: `Gagal menyetujui event: ${error.message}` };
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath(`/superadmin/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/");

    return { success: true, message: "Event berhasil disetujui dan kini tayang di halaman publik." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Menolak pengajuan Event Kampus
 */
export async function rejectEvent(eventId: string, reason: string): Promise<ActionResponse> {
  if (!reason || reason.trim().length === 0) {
    return { success: false, message: "Alasan penolakan event wajib diisi." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi Anda telah berakhir." };
    }

    const supabaseAdmin = await createAdminClient();

    // Tambahkan record penolakan baru
    const { error } = await supabaseAdmin
      .from("event_approvals")
      .insert({
        event_id: eventId,
        status: "reject",
        note: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, message: `Gagal menolak event: ${error.message}` };
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath(`/superadmin/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/");

    return { success: true, message: "Event telah ditolak dan alasan penolakan telah disimpan." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Menambah Kategori Event Baru
 */
export async function createCategory(name: string): Promise<ActionResponse> {
  if (!name || name.trim().length === 0) {
    return { success: false, message: "Nama kategori wajib diisi." };
  }

  try {
    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("event_categories")
      .insert({ name: name.trim() });

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Kategori dengan nama tersebut sudah ada." };
      }
      return { success: false, message: `Gagal menambah kategori: ${error.message}` };
    }

    revalidatePath("/superadmin/categories");
    revalidatePath("/events");
    revalidatePath("/publisher/events/create");
    return { success: true, message: "Kategori baru berhasil ditambahkan." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Memperbarui Nama Kategori Event
 */
export async function updateCategory(id: string, name: string): Promise<ActionResponse> {
  if (!name || name.trim().length === 0) {
    return { success: false, message: "Nama kategori wajib diisi." };
  }

  try {
    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("event_categories")
      .update({ name: name.trim() })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Kategori dengan nama tersebut sudah ada." };
      }
      return { success: false, message: `Gagal memperbarui kategori: ${error.message}` };
    }

    revalidatePath("/superadmin/categories");
    revalidatePath("/events");
    revalidatePath("/publisher/events/create");
    return { success: true, message: "Kategori berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Menghapus Kategori Event
 */
export async function deleteCategory(id: string): Promise<ActionResponse> {
  try {
    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("event_categories")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return { success: false, message: "Kategori tidak dapat dihapus karena masih digunakan oleh beberapa event." };
      }
      return { success: false, message: `Gagal menghapus kategori: ${error.message}` };
    }

    revalidatePath("/superadmin/categories");
    revalidatePath("/events");
    revalidatePath("/publisher/events/create");
    return { success: true, message: "Kategori berhasil dihapus." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/* =========================================================================
   ADMINISTRASI CRUD: EVENT
   ========================================================================= */

/**
 * Membuat event baru oleh Admin (bisa menentukan publisher penyelenggara)
 */
export async function superadminCreateEvent(formData: FormData): Promise<ActionResponse> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("category_id") as string;
  const location = formData.get("location") as string;
  const startDateStr = formData.get("start_date") as string;
  const endDateStr = formData.get("end_date") as string;
  const posterFile = formData.get("poster_image") as File;
  const publisherId = formData.get("publisher_id") as string; // Diassign ke publisher terpilih

  if (!title || !categoryId || !startDateStr || !publisherId) {
    return { success: false, message: "Judul, kategori, tanggal mulai, dan penyelenggara wajib diisi." };
  }

  try {
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
      return { success: false, message: `Gagal membuat event: ${eventError?.message}` };
    }

    // 2. Setujui secara otomatis karena dibuat oleh Superadmin
    const { error: approvalError } = await supabaseAdmin
      .from("event_approvals")
      .insert({
        event_id: event.id,
        status: "approve",
        note: "Dibuat langsung oleh Superadmin",
      });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Event baru berhasil diterbitkan oleh Superadmin." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat membuat event." };
  }
}

/**
 * Mengubah data event oleh Admin
 */
export async function superadminUpdateEvent(eventId: string, formData: FormData): Promise<ActionResponse> {
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
    return { success: false, message: "Judul, kategori, tanggal mulai, dan penyelenggara wajib diisi." };
  }

  try {
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
      return { success: false, message: `Gagal memperbarui event: ${error.message}` };
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath(`/superadmin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Event berhasil diperbarui oleh Superadmin." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui event." };
  }
}

/**
 * Menghapus event secara permanen oleh Admin
 */
export async function superadminDeleteEvent(eventId: string): Promise<ActionResponse> {
  try {
    const supabaseAdmin = await createAdminClient();
    
    // Hapus event (riwayat approvals akan otomatis cascade terhapus karena referensi cascade di schema)
    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      return { success: false, message: `Gagal menghapus event secara permanen: ${error.message}` };
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Event berhasil dihapus secara permanen dari sistem." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/* =========================================================================
   ADMINISTRASI CRUD: PUBLISHER (AKUN INSTANSI)
   ========================================================================= */

/**
 * Membuat akun Publisher baru langsung disetujui oleh Admin
 */
export async function superadminCreatePublisher(formData: FormData): Promise<ActionResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgName = formData.get("org_name") as string;
  const orgAbbreviation = formData.get("org_abbreviation") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("org_logo") as File;

  if (!email || !password || !orgName) {
    return { success: false, message: "Email, Password, dan Nama Instansi wajib diisi." };
  }

  try {
    let orgLogoUrl = "";
    if (logoFile && logoFile.size > 0) {
      orgLogoUrl = await uploadToCloudinary(logoFile);
    }

    const supabaseAdmin = await createAdminClient();

    // Daftarkan ke auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "publisher",
        status: "approve",
        org_name: orgName,
        org_logo: orgLogoUrl,
        org_abbreviation: orgAbbreviation,
        phone,
        address,
      },
    });

    if (error) {
      let friendlyMessage = error.message;
      if (error.message.includes("already registered")) {
        friendlyMessage = "Email sudah terdaftar.";
      }
      return { success: false, message: `Gagal membuat akun publisher: ${friendlyMessage}` };
    }

    if (data.user) {
      // Set status ke approve di tabel public.users
      await supabaseAdmin
        .from("users")
        .update({ status: "approve" })
        .eq("id", data.user.id);
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/publishers");

    return { success: true, message: "Akun publisher baru berhasil dibuat dan langsung disetujui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Mengubah data profil dan status Publisher oleh Admin
 */
export async function superadminUpdatePublisher(publisherId: string, formData: FormData): Promise<ActionResponse> {
  const orgName = formData.get("org_name") as string;
  const orgAbbreviation = formData.get("org_abbreviation") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("org_logo") as File;
  const currentLogoUrl = formData.get("current_org_logo") as string;
  const status = formData.get("status") as "pending" | "approve" | "reject";
  const rejectReason = formData.get("reject_reason") as string;

  if (!orgName) {
    return { success: false, message: "Nama Instansi wajib diisi." };
  }

  try {
    const supabaseAdmin = await createAdminClient();

    let logoUrl = currentLogoUrl;
    if (logoFile && logoFile.size > 0) {
      logoUrl = await uploadToCloudinary(logoFile);
    }

    // 1. Update tabel public.profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        org_name: orgName,
        org_logo: logoUrl || null,
        org_abbreviation: orgAbbreviation || null,
        phone: phone || null,
        address: address || null,
      })
      .eq("user_id", publisherId);

    if (profileError) {
      return { success: false, message: `Gagal memperbarui profil: ${profileError.message}` };
    }

    // 2. Update status di tabel public.users
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        status,
        reject_reason: status === "reject" ? rejectReason : null,
      })
      .eq("id", publisherId);

    if (userError) {
      return { success: false, message: `Gagal memperbarui status user: ${userError.message}` };
    }

    // 3. Sinkronisasikan metadata auth user
    await supabaseAdmin.auth.admin.updateUserById(publisherId, {
      user_metadata: {
        status,
        org_name: orgName,
        org_logo: logoUrl,
        org_abbreviation: orgAbbreviation,
        phone,
        address,
      }
    });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/publishers");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Profil dan status akun publisher berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Menghapus akun pengguna (Superadmin/Publisher) secara permanen
 */
export async function superadminDeleteUser(userId: string): Promise<ActionResponse> {
  try {
    const supabaseAdmin = await createAdminClient();

    // Hapus dari auth (akan men-cascade profile & users jika FK di set cascade)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      // Hapus manual jika cascade gagal
      await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
      const { error: userError } = await supabaseAdmin.from("users").delete().eq("id", userId);
      
      if (userError) {
        return { success: false, message: `Gagal menghapus user: ${userError.message}` };
      }
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Akun pengguna berhasil dihapus secara permanen dari sistem." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Membuat akun baru (Superadmin atau Publisher) langsung disetujui oleh Admin
 */
export async function superadminCreateUser(formData: FormData): Promise<ActionResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "superadmin" | "publisher";
  
  // Bidang spesifik Publisher
  const orgName = formData.get("org_name") as string;
  const orgAbbreviation = formData.get("org_abbreviation") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("org_logo") as File;

  if (!email || !password || !role) {
    return { success: false, message: "Email, Password, dan Role wajib diisi." };
  }

  if (role === "publisher" && !orgName) {
    return { success: false, message: "Nama Instansi wajib diisi untuk akun Publisher." };
  }

  try {
    let orgLogoUrl = "";
    let finalOrgName = role === "superadmin" ? "Administrator" : orgName;

    const supabaseAdmin = await createAdminClient();

    if (role === "publisher") {
      if (logoFile && logoFile.size > 0) {
        orgLogoUrl = await uploadToCloudinary(logoFile);
      }
    }

    // Daftarkan ke auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        status: "approve", // langsung aktif disetujui
        org_name: finalOrgName,
        org_logo: orgLogoUrl || null,
        org_abbreviation: role === "publisher" ? orgAbbreviation : null,
        phone: role === "publisher" ? phone : null,
        address: role === "publisher" ? address : null,
      },
    });

    if (error) {
      let friendlyMessage = error.message;
      if (error.message.includes("already registered")) {
        friendlyMessage = "Email sudah terdaftar.";
      }
      return { success: false, message: `Gagal membuat akun: ${friendlyMessage}` };
    }

    if (data.user) {
      // Set status ke approve di tabel public.users
      await supabaseAdmin
        .from("users")
        .update({ status: "approve" })
        .eq("id", data.user.id);
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");

    return { success: true, message: `Akun ${role === "superadmin" ? "Superadmin" : "Publisher"} baru berhasil dibuat.` };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

/**
 * Mengubah data profil, role, dan status pengguna oleh Admin
 */
export async function superadminUpdateUser(userId: string, formData: FormData): Promise<ActionResponse> {
  const role = formData.get("role") as "superadmin" | "publisher";
  const orgName = formData.get("org_name") as string;
  const orgAbbreviation = formData.get("org_abbreviation") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("org_logo") as File;
  const currentLogoUrl = formData.get("current_org_logo") as string;
  const status = formData.get("status") as "pending" | "approve" | "reject";
  const rejectReason = formData.get("reject_reason") as string;

  const finalOrgName = role === "superadmin" ? (orgName || "Administrator") : orgName;

  if (role === "publisher" && !orgName) {
    return { success: false, message: "Nama Instansi wajib diisi untuk akun Publisher." };
  }

  try {
    const supabaseAdmin = await createAdminClient();

    let logoUrl = currentLogoUrl;
    if (role === "publisher" && logoFile && logoFile.size > 0) {
      logoUrl = await uploadToCloudinary(logoFile);
    }

    // 1. Update tabel public.profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        org_name: finalOrgName,
        org_logo: role === "publisher" ? (logoUrl || null) : null,
        org_abbreviation: role === "publisher" ? (orgAbbreviation || null) : null,
        phone: role === "publisher" ? (phone || null) : null,
        address: role === "publisher" ? (address || null) : null,
      })
      .eq("user_id", userId);

    if (profileError) {
      return { success: false, message: `Gagal memperbarui profil: ${profileError.message}` };
    }

    // 2. Update status di tabel public.users
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        status,
        reject_reason: status === "reject" ? rejectReason : null,
      })
      .eq("id", userId);

    if (userError) {
      return { success: false, message: `Gagal memperbarui status user: ${userError.message}` };
    }

    // 3. Sinkronisasikan metadata auth user
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        status,
        role,
        org_name: finalOrgName,
        org_logo: role === "publisher" ? logoUrl : null,
        org_abbreviation: role === "publisher" ? orgAbbreviation : null,
        phone: role === "publisher" ? phone : null,
        address: role === "publisher" ? address : null,
      }
    });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, message: "Data pengguna berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}
