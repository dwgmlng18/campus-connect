"use server";

import { createClient } from "@/lib/supabase/server";
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

  if (!email || !password || !orgName) {
    return { success: false, message: "Email, Password, dan Nama Instansi wajib diisi." };
  }

  try {
    let orgLogoUrl = "";
    
    // Unggah logo ke Cloudinary jika dilampirkan
    if (logoFile && logoFile.size > 0) {
      orgLogoUrl = await uploadToCloudinary(logoFile);
    }

    const supabase = await createClient();

    // Mendaftarkan user ke Supabase Auth
    // Data metadata dikirimkan agar dibaca oleh trigger database
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          role: "publisher",
          status: "pending",
          org_name: orgName,
          org_logo: orgLogoUrl,
          org_abbreviation: orgAbbreviation,
          phone,
          address,
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data.user) {
      return { success: false, message: "Gagal membuat akun." };
    }

    return {
      success: true,
      message: "Registrasi berhasil! Akun Anda berstatus 'pending'. Harap tunggu persetujuan Superadmin sebelum dapat login.",
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat mendaftar." };
  }
}

/**
 * Melakukan verifikasi login pengguna
 */
export async function loginUser(formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "Email dan Password wajib diisi." };
  }

  try {
    const supabase = await createClient();

    // Lakukan login dengan Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, message: authError.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { success: false, message: "Terjadi masalah saat mengambil data pengguna." };
    }

    // Periksa status akun di tabel public.users
    const { data: publicUser, error: userError } = await supabase
      .from("users")
      .select("role, status, reject_reason")
      .eq("id", userId)
      .single();

    if (userError || !publicUser) {
      // Jika terjadi error membaca data publik, sign out paksa demi keamanan
      await supabase.auth.signOut();
      return { success: false, message: "Data profil akun Anda tidak ditemukan." };
    }

    // Validasi status persetujuan
    if (publicUser.status === "pending") {
      await supabase.auth.signOut();
      return {
        success: false,
        message: "Akun Anda sedang dalam proses peninjauan (pending) oleh Superadmin.",
      };
    }

    if (publicUser.status === "reject") {
      await supabase.auth.signOut();
      const reason = publicUser.reject_reason 
        ? ` Alasan: ${publicUser.reject_reason}` 
        : " Silakan hubungi admin.";
      return {
        success: false,
        message: `Pendaftaran akun Anda ditolak oleh Superadmin.${reason}`,
      };
    }

    // Jika disetujui (approve), tentukan redirect berdasarkan role
    const role = publicUser.role;
    let redirectTo = "/";
    if (role === "superadmin") {
      redirectTo = "/superadmin/dashboard";
    } else if (role === "publisher") {
      redirectTo = "/publisher/dashboard";
    }

    return {
      success: true,
      message: "Login berhasil!",
      redirectTo,
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat login." };
  }
}

/**
 * Melakukan logout pengguna
 */
export async function logoutUser(): Promise<AuthState> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true, message: "Logout berhasil!", redirectTo: "/login" };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal melakukan logout." };
  }
}
