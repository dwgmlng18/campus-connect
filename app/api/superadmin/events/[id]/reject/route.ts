import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Alasan penolakan event wajib diisi." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();

    const { error } = await supabaseAdmin
      .from("event_approvals")
      .insert({
        event_id: eventId,
        status: "reject",
        note: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ success: false, message: `Gagal menolak event: ${error.message}` }, { status: 400 });
    }

    revalidatePath("/superadmin/dashboard");
    revalidatePath("/superadmin/events");
    revalidatePath(`/superadmin/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Event telah ditolak dan alasan penolakan telah disimpan." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
