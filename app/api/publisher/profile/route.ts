import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const orgName = formData.get("org_name") as string;
    const orgAbbreviation = formData.get("org_abbreviation") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("org_logo") as File;
    const currentLogoUrl = formData.get("current_org_logo") as string;

    if (!orgName) {
      return NextResponse.json({ success: false, message: "Nama Instansi wajib diisi." }, { status: 400 });
    }

    // 1. Verifikasi pengguna yang terautentikasi
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
    }

    let logoUrl = currentLogoUrl;
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Ukuran berkas logo instansi melebihi batas maksimal 5MB." }, { status: 400 });
      }
      logoUrl = await uploadToCloudinary(logoFile);
    }

    // Gunakan admin client untuk menulis data demi mem-bypass RLS
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
      return NextResponse.json({ success: false, message: `Gagal memperbarui profil: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/publisher/dashboard");
    revalidatePath("/publisher/profile");
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Profil berhasil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem saat memperbarui profil." }, { status: 500 });
  }
}
