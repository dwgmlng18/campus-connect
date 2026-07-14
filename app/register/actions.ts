"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface AuthState {
  success: boolean;
  message: string;
  redirectTo?: string;
}

/**
 * Mendaftarkan akun Publisher baru
 */
export async function registerPublisher(formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgName = formData.get("org_name") as string;
  const orgAbbreviation = formData.get("org_abbreviation") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("org_logo") as File;

  // 1. Validasi Bidang Wajib
  if (!email || !password || !orgName) {
    return { success: false, message: "Email, Password, dan Nama Instansi wajib diisi." };
  }

  // 2. Validasi Format Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Format alamat email tidak valid (contoh: nama@univ.ac.id)." };
  }

  // 3. Validasi Panjang Password
  if (password.length < 6) {
    return { success: false, message: "Password minimal harus memiliki 6 karakter." };
  }

  // 4. Validasi Logo (Jika ada)
  if (logoFile && logoFile.size > 0) {
    // Validasi Ukuran (Maks 2MB)
    if (logoFile.size > 2 * 1024 * 1024) {
      return { success: false, message: "Ukuran berkas logo instansi melebihi batas maksimal 2MB." };
    }
    // Validasi Tipe Berkas Gambar
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(logoFile.type)) {
      return { success: false, message: "Format logo instansi harus berupa gambar (JPG, PNG, WEBP, atau GIF)." };
    }
  }

  try {
    let orgLogoUrl = "";
    
    // Unggah logo ke Cloudinary jika dilampirkan
    if (logoFile && logoFile.size > 0) {
      orgLogoUrl = await uploadToCloudinary(logoFile);
    }

    const supabaseAdmin = await createAdminClient();

    // Mendaftarkan user ke Supabase Auth secara otomatis terkonfirmasi (tanpa perlu kirim email verifikasi)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mengonfirmasi email secara instan
      user_metadata: {
        role: "publisher",
        status: "pending",
        org_name: orgName,
        org_logo: orgLogoUrl,
        org_abbreviation: orgAbbreviation,
        phone,
        address,
      },
    });

    if (error) {
      let friendlyMessage = error.message;
      if (error.message.includes("User already registered")) {
        friendlyMessage = "Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun Anda.";
      }
      return { success: false, message: friendlyMessage };
    }

    if (!data.user) {
      return { success: false, message: "Gagal membuat akun." };
    }

    return {
      success: true,
      message: "Pendaftaran berhasil! Akun Anda saat ini berstatus pending dan sedang menunggu persetujuan admin.",
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat mendaftar." };
  }
}
