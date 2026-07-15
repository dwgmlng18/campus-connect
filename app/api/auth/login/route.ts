import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Validasi Bidang Wajib
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email dan Password wajib diisi." }, { status: 400 });
    }

    // 2. Validasi Format Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Format alamat email tidak valid (contoh: nama@univ.ac.id)." }, { status: 400 });
    }

    const supabase = await createClient();

    // Lakukan login dengan Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      let friendlyMessage = authError.message;
      if (authError.message === "Invalid login credentials") {
        return NextResponse.json({ success: false, message: "Email atau password yang Anda masukkan salah. Silakan periksa kembali." }, { status: 400 });
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
                return NextResponse.json({
                  success: false,
                  message: `Pendaftaran Anda ditolak admin.${reason}`,
                }, { status: 400 });
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
                  return NextResponse.json({
                    success: true,
                    message: "Login berhasil!",
                    redirectTo,
                  });
                }
              }
            }
          }
        } catch (dbErr) {
          console.error("Gagal memeriksa status penolakan/persetujuan untuk email belum dikonfirmasi:", dbErr);
        }
        
        return NextResponse.json({ success: false, message: "Akun Anda belum dikonfirmasi oleh admin. Silakan tunggu persetujuan." }, { status: 400 });
      }
      
      return NextResponse.json({ success: false, message: friendlyMessage }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, message: "Terjadi masalah saat mengambil data pengguna." }, { status: 400 });
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
      return NextResponse.json({ 
        success: false, 
        message: `Data profil akun Anda tidak ditemukan di database. Pastikan baris data untuk User ID "${userId}" sudah ada di tabel public.users.${errDetails}` 
      }, { status: 400 });
    }

    // Validasi status persetujuan
    if (publicUser.status === "pending") {
      await supabase.auth.signOut();
      return NextResponse.json({
        success: false,
        message: "Akun Anda belum dikonfirmasi oleh admin. Silakan tunggu persetujuan.",
      }, { status: 400 });
    }

    if (publicUser.status === "reject") {
      await supabase.auth.signOut();
      const reason = publicUser.reject_reason 
        ? ` Alasan: "${publicUser.reject_reason}"` 
        : "";
      return NextResponse.json({
        success: false,
        message: `Pendaftaran Anda ditolak admin.${reason}`,
      }, { status: 400 });
    }

    // Jika disetujui (approve), tentukan redirect berdasarkan role
    const role = publicUser.role;
    let redirectTo = "/";
    if (role === "superadmin") {
      redirectTo = "/superadmin/dashboard";
    } else if (role === "publisher") {
      redirectTo = "/publisher/dashboard";
    }

    return NextResponse.json({
      success: true,
      message: "Login berhasil!",
      redirectTo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat login." }, { status: 500 });
  }
}
