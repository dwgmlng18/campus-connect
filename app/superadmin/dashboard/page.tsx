import React from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0; // Data statistik harus selalu real-time

export default async function SuperadminDashboardPage() {
  const supabaseAdmin = await createAdminClient();

  // 1. Ambil data publisher
  const { data: users = [] } = await supabaseAdmin
    .from("users")
    .select("id, role, status, created_at, profiles(org_name, org_abbreviation)");

  const publishers = (users || []).filter((u: any) => u.role === "publisher");
  const totalPublishers = publishers.length;
  const pendingPublishers = publishers.filter((u: any) => u.status === "pending").length;

  // 2. Ambil data kategori
  const { count: totalCategories = 0 } = await supabaseAdmin
    .from("event_categories")
    .select("id", { count: "exact", head: true });

  // 3. Ambil data event
  const { data: events = [] } = await supabaseAdmin
    .from("events")
    .select(`
      id,
      title,
      created_at,
      profiles:created_by(profiles(org_name, org_abbreviation)),
      approvals:event_approvals(status, created_at)
    `);

  // Helper untuk mencari status persetujuan terbaru
  const getLatestApproval = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) return "pending";
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  let totalApprovedEvents = 0;
  let totalPendingEvents = 0;

  const eventsWithApprovalStatus = (events || []).map((e: any) => {
    const latestStatus = getLatestApproval(e.approvals);
    if (latestStatus === "approve") totalApprovedEvents++;
    else if (latestStatus === "pending") totalPendingEvents++;
    return {
      ...e,
      approval_status: latestStatus,
    };
  });

  // Ambil list pending untuk quick review
  const pendingPublisherList = publishers
    .filter((p: any) => p.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const pendingEventList = eventsWithApprovalStatus
    .filter((e: any) => e.approval_status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Dashboard Superadmin
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Selamat datang di panel kendali utama. Pantau data platform secara terintegrasi.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Publisher */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Publisher</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{totalPublishers}</span>
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Akun</span>
          </div>
        </div>

        {/* Pending Publisher */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 transition ${
          pendingPublishers > 0
            ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/50"
            : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800"
        }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Publisher Pending</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${pendingPublishers > 0 ? "text-amber-500" : "text-slate-800 dark:text-slate-200"}`}>
              {pendingPublishers}
            </span>
            {pendingPublishers > 0 && (
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500"></span>
            )}
          </div>
        </div>

        {/* Event Disetujui */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Disetujui</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-accent-600 dark:text-accent-400">{totalApprovedEvents}</span>
            <span className="text-xs font-bold text-slate-400">Live</span>
          </div>
        </div>

        {/* Event Pending */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 transition ${
          totalPendingEvents > 0
            ? "bg-red-50/50 border-red-200 dark:bg-red-950/10 dark:border-red-900/50"
            : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800"
        }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Pending</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${totalPendingEvents > 0 ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}>
              {totalPendingEvents}
            </span>
            {totalPendingEvents > 0 && (
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </div>
        </div>

        {/* Total Kategori */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kategori</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{totalCategories}</span>
            <span className="text-xs font-bold text-slate-400">Data</span>
          </div>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Quick Review Publisher */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Menunggu Persetujuan Akun</h3>
                <p className="text-xs text-slate-500 mt-1">Daftar publisher baru yang meminta persetujuan registrasi.</p>
              </div>
              <Link href="/superadmin/users" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition">
                Lihat Semua
              </Link>
            </div>

            {pendingPublisherList.length > 0 ? (
              <div className="space-y-4">
                {pendingPublisherList.map((pub: any) => (
                  <div key={pub.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {pub.profiles?.org_name || "Instansi Tanpa Nama"}
                      </h4>
                      <p className="text-xs text-slate-400 uppercase font-semibold mt-0.5 tracking-wider">
                        {pub.profiles?.org_abbreviation || "PUBLISHER"}
                      </p>
                    </div>
                    <Link
                      href="/superadmin/users"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition"
                    >
                      Tinjau
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                <p className="text-sm text-slate-400">Tidak ada pengajuan akun pending.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Review Event */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pengajuan Event Baru</h3>
                <p className="text-xs text-slate-500 mt-1">Daftar kegiatan mahasiswa baru yang menunggu review.</p>
              </div>
              <Link href="/superadmin/events" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition">
                Lihat Semua
              </Link>
            </div>

            {pendingEventList.length > 0 ? (
              <div className="space-y-4">
                {pendingEventList.map((event: any) => (
                  <div key={event.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        Oleh: {event.profiles?.profiles?.org_name || "Penyelenggara"}
                      </p>
                    </div>
                    <Link
                      href="/superadmin/events"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition flex-shrink-0"
                    >
                      Tinjau
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                <p className="text-sm text-slate-400">Tidak ada pengajuan event pending.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
