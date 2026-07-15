import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0; // Data harus selalu paling mutakhir

export default async function PublisherDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();

  const nowIso = new Date().toISOString();

  // Auto-clean: Update status event yang sudah lewat menjadi 'inactive'
  await supabaseAdmin
    .from("events")
    .update({ status: "inactive" })
    .eq("status", "active")
    .lt("end_date", nowIso);

  await supabaseAdmin
    .from("events")
    .update({ status: "inactive" })
    .eq("status", "active")
    .is("end_date", null)
    .lt("start_date", nowIso);

  // 1. Ambil nama instansi untuk ucapan selamat datang via admin client
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("org_name")
    .eq("user_id", user.id)
    .single();

  // 2. Ambil seluruh event milik publisher ini beserta riwayat approvals-nya via admin client
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
    .eq("created_by", user.id);

  // Helper untuk mendapatkan status approval terbaru untuk setiap event
  const getLatestApproval = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) return "pending";
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  // Hitung statistik
  const totalEvents = events?.length || 0;
  let approvedEventsCount = 0;
  let pendingEventsCount = 0;
  let rejectedEventsCount = 0;

  const eventsWithApprovalStatus = (events || []).map((e: any) => {
    const latestStatus = getLatestApproval(e.approvals);
    if (latestStatus === "approve") approvedEventsCount++;
    else if (latestStatus === "pending") pendingEventsCount++;
    else if (latestStatus === "reject") rejectedEventsCount++;

    return {
      ...e,
      approval_status: latestStatus,
    };
  });

  // Urutkan event terbaru berdasarkan tanggal dibuat (limit 5)
  const recentEvents = [...eventsWithApprovalStatus]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Selamat Datang, {profile?.org_name || "Publisher"}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Kelola kegiatan kampus Anda di satu dashboard terintegrasi.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Event */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Event Saya</span>
            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">
            {totalEvents}
          </span>
        </div>

        {/* Disetujui */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Disetujui Admin</span>
            <span className="p-1 bg-accent-100 dark:bg-accent-950/40 rounded-lg text-accent-600 dark:text-accent-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <span className="text-3xl font-extrabold text-accent-600 dark:text-accent-400">
            {approvedEventsCount}
          </span>
        </div>

        {/* Menunggu Review */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Menunggu Review</span>
            <span className="p-1 bg-amber-100 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <span className="text-3xl font-extrabold text-amber-500">
            {pendingEventsCount}
          </span>
        </div>

        {/* Ditolak */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ditolak Admin</span>
            <span className="p-1 bg-red-100 dark:bg-red-950/40 rounded-lg text-red-600 dark:text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <span className="text-3xl font-extrabold text-red-500">
            {rejectedEventsCount}
          </span>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Daftar Event Terakhir
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ringkasan 5 kegiatan terbaru yang Anda publikasikan.
            </p>
          </div>
          <Link
            href="/publisher/events"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition"
          >
            Lihat Semua Event
          </Link>
        </div>

        {recentEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                  <th className="py-4 px-6">Nama Event</th>
                  <th className="py-4 px-6">Tanggal Mulai</th>
                  <th className="py-4 px-6 text-center">Status Review</th>
                  <th className="py-4 px-6 text-center">Status Operasional</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {recentEvents.map((event) => {
                  const formattedDate = new Date(event.start_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  // Label badge persetujuan (approval_status)
                  const approvalStyles = {
                    approve: "bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400 border-accent-200 dark:border-accent-850",
                    pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500 border-amber-200 dark:border-amber-850",
                    reject: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500 border-red-200 dark:border-red-850",
                  };

                  const approvalLabels = {
                    approve: "Disetujui",
                    pending: "Menunggu",
                    reject: "Ditolak",
                  };

                  // Label badge operasional (status)
                  const operationalStyles = {
                    active: "bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400 border-accent-200 dark:border-accent-850",
                    inactive: "bg-slate-100 text-slate-600 dark:bg-slate-950/50 dark:text-slate-400 border-slate-200 dark:border-slate-850",
                    deleted: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500 border-red-200 dark:border-red-850",
                  };

                  const operationalLabels = {
                    active: "Aktif",
                    inactive: "Nonaktif",
                    deleted: "Dihapus",
                  };

                  return (
                    <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition">
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        {event.title}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                        {formattedDate}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${approvalStyles[event.approval_status as keyof typeof approvalStyles]}`}>
                          {approvalLabels[event.approval_status as keyof typeof approvalLabels]}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${operationalStyles[event.status as keyof typeof operationalStyles]}`}>
                          {operationalLabels[event.status as keyof typeof operationalLabels]}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-3 text-xs font-bold">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-slate-500 hover:text-primary-600 transition"
                          >
                            Lihat Detail
                          </Link>
                          {event.status !== "deleted" && (
                            <Link
                              href={`/publisher/events/${event.id}/edit`}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h4 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Event</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mulai buat event kampus pertama Anda sekarang!</p>
          </div>
        )}
      </div>
    </div>
  );
}
