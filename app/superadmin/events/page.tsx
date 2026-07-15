import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import EventsList from "@/components/EventsList";

export const revalidate = 0;

export default async function SuperadminEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();
  // Ambil data semua event beserta data instansi penyelenggara dan riwayat persetujuannya
  const { data: rawEvents = [] } = await supabaseAdmin
    .from("events")
    .select(`
      id,
      title,
      start_date,
      end_date,
      location,
      profiles:created_by(profiles(org_name)),
      approvals:event_approvals(status, note, created_at)
    `)
    .order("created_at", { ascending: false });

  // Helper untuk mencari record persetujuan terbaru untuk setiap event
  const getLatestApproval = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) {
      return { status: "pending", note: null };
    }
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      status: sorted[0].status,
      note: sorted[0].note,
    };
  };

  const formattedEvents = (rawEvents || []).map((event: any) => {
    const pubProfile = event.profiles?.profiles;
    const approvalInfo = getLatestApproval(event.approvals);

    return {
      id: event.id,
      title: event.title,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location || null,
      org_name: pubProfile?.org_name || "Penyelenggara",
      approval_status: approvalInfo.status,
      reject_reason: approvalInfo.note,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Review Pengajuan Event
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Tinjau, setujui, atau tolak kegiatan kampus yang diajukan oleh publisher. Event yang disetujui otomatis tayang ke publik.
          </p>
        </div>
        <Link
          href="/superadmin/events/create"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Event Baru
        </Link>
      </div>

      {/* Events Table/List */}
      <EventsList initialEvents={formattedEvents} />
    </div>
  );
}
