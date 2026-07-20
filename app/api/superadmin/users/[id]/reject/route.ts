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
    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Alasan penolakan wajib diisi." }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();
    
    const { error } = await supabaseAdmin
      .from("users")
      .update({ status: "reject", reject_reason: reason })
      .eq("id", publisherId);

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal menolak akun: ${error.message}` }, { status: 400 });
    }

    const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(publisherId);
    
    if (getUserError || !authUser) {
      return NextResponse.json({ success: false, message: "User auth tidak ditemukan." }, { status: 404 });
    }

    const currentMetadata = authUser.user_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(publisherId, {
      user_metadata: { ...currentMetadata, status: "reject" }
    });

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/users");
    return NextResponse.json({ success: true, message: "Pendaftaran akun publisher telah ditolak." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
