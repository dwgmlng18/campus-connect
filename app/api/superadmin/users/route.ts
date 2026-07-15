import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
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
      return NextResponse.json({ success: false, message: "Email, Password, dan Role wajib diisi." }, { status: 400 });
    }

    if (role === "publisher" && !orgName) {
      return NextResponse.json({ success: false, message: "Nama Instansi wajib diisi untuk akun Publisher." }, { status: 400 });
    }

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
      return NextResponse.json({ success: false, message: `Gagal membuat akun: ${friendlyMessage}` }, { status: 400 });
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

    return NextResponse.json({ success: true, message: `Akun ${role === "superadmin" ? "Superadmin" : "Publisher"} baru berhasil dibuat.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
