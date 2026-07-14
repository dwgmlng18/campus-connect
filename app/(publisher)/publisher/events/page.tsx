import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import EventsTable from "./EventsTable";

export const revalidate = 0; // Data real-time

export default async function PublisherEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();

  // Ambil semua event milik publisher ini (menggunakan admin client untuk bypass RLS select loop)
  const { data: events = [] } = await supabaseAdmin
    .from("events")
    .select(`
      id,
      title,
      start_date,
      status,
      created_at,
      approvals:event_approvals(status, created_at)
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  // Helper untuk mendapatkan status approval terbaru
  const getLatestApproval = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) return "pending";
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  const formattedEvents = (events || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    start_date: e.start_date,
    status: e.status,
    approval_status: getLatestApproval(e.approvals),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Event Saya
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Daftar kegiatan kampus yang telah Anda publikasikan beserta status review-nya.
          </p>
        </div>
        <Link
          href="/publisher/events/create"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Event Baru
        </Link>
      </div>

      {/* Tabel Pengelolaan Event */}
      <EventsTable initialEvents={formattedEvents} />
    </div>
  );
}
