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
    const userId = resolvedParams.id;

    const formData = await request.formData();
    const role = formData.get("role") as "superadmin" | "publisher";
    const orgName = formData.get("org_name") as string;
    const orgAbbreviation = formData.get("org_abbreviation") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("org_logo") as File;
    const currentLogoUrl = formData.get("current_org_logo") as string;
    const status = formData.get("status") as "pending" | "approve" | "reject";
    const rejectReason = formData.get("reject_reason") as string;
    const password = formData.get("password") as string;

    const finalOrgName = role === "superadmin" ? (orgName || "Administrator") : orgName;

    if (role === "publisher" && !orgName) {
      return NextResponse.json({ success: false, message: "Nama Instansi wajib diisi untuk akun Publisher." }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();

    let logoUrl = currentLogoUrl;
    if (role === "publisher" && logoFile && logoFile.size > 0) {
      logoUrl = await uploadToCloudinary(logoFile);
    }

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
      return NextResponse.json({ success: false, message: `Gagal memperbarui profil: ${profileError.message}` }, { status: 400 });
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        status,
        reject_reason: status === "reject" ? rejectReason : null,
      })
      .eq("id", userId);

    if (userError) {
      return NextResponse.json({ success: false, message: `Gagal memperbarui status user: ${userError.message}` }, { status: 400 });
    }

    const updateParams: any = {
      user_metadata: {
        status,
        role,
        org_name: finalOrgName,
        org_logo: role === "publisher" ? logoUrl : null,
        org_abbreviation: role === "publisher" ? orgAbbreviation : null,
        phone: role === "publisher" ? phone : null,
        address: role === "publisher" ? address : null,
      }
    };

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ success: false, message: "Password baru minimal harus memiliki 6 karakter." }, { status: 400 });
      }
      updateParams.password = password;
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, updateParams);

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Data pengguna berhasil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const supabaseAdmin = await createAdminClient();

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
      const { error: userError } = await supabaseAdmin.from("users").delete().eq("id", userId);
      
      if (userError) {
        return NextResponse.json({ success: false, message: `Gagal menghapus user: ${userError.message}` }, { status: 400 });
      }
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Akun pengguna berhasil dihapus secara permanen dari sistem." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
