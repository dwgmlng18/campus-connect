import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const publisherId = resolvedParams.id;

    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("users")
      .update({ status: "approve", reject_reason: null })
      .eq("id", publisherId);

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal menyetujui akun: ${error.message}` }, { status: 400 });
    }

    // Ambil metadata auth user saat ini agar tidak ter-overwrite
    const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(publisherId);
    
    if (getUserError || !authUser) {
      return NextResponse.json({ success: false, message: "User auth tidak ditemukan." }, { status: 404 });
    }

    const currentMetadata = authUser.user_metadata || {};

    // Perbarui metadata auth user dengan di-merge
    await supabaseAdmin.auth.admin.updateUserById(publisherId, {
      user_metadata: { ...currentMetadata, status: "approve" }
    });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    return NextResponse.json({ success: true, message: "Akun publisher berhasil disetujui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
