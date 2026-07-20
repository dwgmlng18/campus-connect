import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const orgName = formData.get("org_name") as string;
    const orgAbbreviation = formData.get("org_abbreviation") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("org_logo") as File;

    if (!email || !password || !orgName) {
      return NextResponse.json({ success: false, message: "Email, Password, dan Nama Instansi wajib diisi." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Format alamat email tidak valid (contoh: nama@univ.ac.id)." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Password minimal harus memiliki 6 karakter." }, { status: 400 });
    }

    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Ukuran berkas logo instansi melebihi batas maksimal 5MB." }, { status: 400 });
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(logoFile.type)) {
        return NextResponse.json({ success: false, message: "Format logo instansi harus berupa gambar (JPG, PNG, WEBP, atau GIF)." }, { status: 400 });
      }
    }

    let orgLogoUrl = "";

    if (logoFile && logoFile.size > 0) {
      orgLogoUrl = await uploadToCloudinary(logoFile);
    }

    const supabaseAdmin = await createAdminClient();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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
      return NextResponse.json({ success: false, message: friendlyMessage }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ success: false, message: "Gagal membuat akun." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil! Akun Anda saat ini berstatus pending dan sedang menunggu persetujuan admin.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat mendaftar." }, { status: 500 });
  }
}
