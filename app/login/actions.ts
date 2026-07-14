"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface AuthState {
  success: boolean;
  message: string;
  redirectTo?: string;
}

/**
 * Melakukan verifikasi login pengguna
 */
export async function loginUser(formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Validasi Bidang Wajib
  if (!email || !password) {
    return { success: false, message: "Email dan Password wajib diisi." };
  }

  // 2. Validasi Format Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Format alamat email tidak valid (contoh: nama@univ.ac.id)." };
  }

  try {
    const supabase = await createClient();

    // Lakukan login dengan Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      let friendlyMessage = authError.message;
      if (authError.message === "Invalid login credentials") {
        return { success: false, message: "Email atau password yang Anda masukkan salah. Silakan periksa kembali." };
      }
      
      if (authError.message.includes("Email not confirmed")) {
        try {
          const supabaseAdmin = await createAdminClient();
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const targetUser = users?.find(u => u.email === email);

          if (targetUser) {
            const { data: dbUser } = await supabaseAdmin
              .from("users")
              .select("role, status, reject_reason")
              .eq("id", targetUser.id)
              .single();

            if (dbUser) {
              if (dbUser.status === "reject") {
                const reason = dbUser.reject_reason 
                  ? ` Alasan: "${dbUser.reject_reason}"` 
                  : "";
                return {
                  success: false,
                  message: `Pendaftaran Anda ditolak admin.${reason}`,
                };
              }

              if (dbUser.status === "approve") {
                // Email belum konfirmasi di Auth tetapi status sudah disetujui di DB.
                // Konfirmasi email secara otomatis agar user langsung dapat login.
                await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
                  email_confirm: true,
                });

                // Coba masuk kembali
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });

                if (!retryError && retryData.user) {
                  const role = dbUser.role;
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
                }
              }
            }
          }
        } catch (dbErr) {
          console.error("Gagal memeriksa status penolakan/persetujuan untuk email belum dikonfirmasi:", dbErr);
        }
        
        return { success: false, message: "Akun Anda belum dikonfirmasi oleh admin. Silakan tunggu persetujuan." };
      }
      
      return { success: false, message: friendlyMessage };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { success: false, message: "Terjadi masalah saat mengambil data pengguna." };
    }

    // Periksa status akun di tabel public.users menggunakan admin client untuk menghindari restriksi RLS
    const supabaseAdmin = await createAdminClient();
    const { data: publicUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, status, reject_reason")
      .eq("id", userId)
      .single();

    if (userError || !publicUser) {
      // Jika terjadi error membaca data publik, sign out paksa demi keamanan
      await supabase.auth.signOut();
      const errDetails = userError ? ` (Error: ${userError.code} - ${userError.message})` : " (Baris data tidak ditemukan)";
      return { 
        success: false, 
        message: `Data profil akun Anda tidak ditemukan di database. Pastikan baris data untuk User ID "${userId}" sudah ada di tabel public.users.${errDetails}` 
      };
    }

    // Validasi status persetujuan
    if (publicUser.status === "pending") {
      await supabase.auth.signOut();
      return {
        success: false,
        message: "Akun Anda belum dikonfirmasi oleh admin. Silakan tunggu persetujuan.",
      };
    }

    if (publicUser.status === "reject") {
      await supabase.auth.signOut();
      const reason = publicUser.reject_reason 
        ? ` Alasan: "${publicUser.reject_reason}"` 
        : "";
      return {
        success: false,
        message: `Pendaftaran Anda ditolak admin.${reason}`,
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

/**
 * Memperbarui password pengguna
 */
export async function updatePassword(password: string): Promise<AuthState> {
  if (!password || password.length < 6) {
    return { success: false, message: "Password minimal harus 6 karakter." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Password Anda berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui password." };
  }
}
