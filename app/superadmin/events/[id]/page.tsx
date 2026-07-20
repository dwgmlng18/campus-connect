import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperadminReviewPanel from "@/components/SuperadminReviewPanel";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminEventDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabaseAdmin = await createAdminClient();

  const { data: rawEvent, error } = await supabaseAdmin
    .from("events")
    .select(`
      id,
      title,
      description,
      location,
      start_date,
      end_date,
      poster_image,
      status,
      created_by,
      category:event_categories(name),
      profiles:created_by(
        profiles(org_name, org_logo, org_abbreviation, phone, address)
      ),
      approvals:event_approvals(status, note, created_at)
    `)
    .eq("id", id)
    .single();

  if (error || !rawEvent) {
    notFound();
  }

  const event = rawEvent as any;

  const getLatestApproval = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) {
      return { status: "pending", note: null };
    }
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { status: sorted[0].status, note: sorted[0].note };
  };

  const approvalInfo = getLatestApproval(event.approvals || []);
  const pubProfile = event.profiles?.profiles;

  const formattedStartDate = new Date(event.start_date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedEndDate = event.end_date
    ? new Date(event.end_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto py-8 w-full">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Link
          href="/superadmin/events"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Review Event
        </Link>
        
        <Link
          href={`/superadmin/events/${event.id}/edit`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Event
        </Link>
      </div>

      {/* Panel Aksi Penilaian Event (Superadmin) */}
      <SuperadminReviewPanel
        eventId={event.id}
        eventTitle={event.title}
        currentStatus={approvalInfo.status}
        rejectReason={approvalInfo.note}
      />

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none transition-colors duration-200">
        
        {/* Gambar Poster Besar */}
        <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-850 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
          {event.poster_image ? (
            <img
              src={event.poster_image}
              alt={event.title}
              className="object-contain w-full h-full max-h-[400px]"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold">Tidak Ada Poster Kegiatan</span>
            </div>
          )}
        </div>

        {/* Konten Utama */}
        <div className="p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {event.category?.name && (
              <span className="px-3 py-1 text-xs font-bold bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-full border border-primary-100 dark:border-primary-900/50">
                {event.category.name}
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
              event.status === "active"
                ? "bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400 border-accent-100"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200"
            }`}>
              Operasional: {event.status === "active" ? "Aktif" : "Nonaktif/Deleted"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-6">
            {event.title}
          </h2>

          {/* Grid Informasi Waktu & Tempat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-850">
            {/* Waktu Kegiatan */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Waktu Mulai</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formattedStartDate}</p>
                {formattedEndDate && (
                  <>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-3">Waktu Selesai</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formattedEndDate}</p>
                  </>
                )}
              </div>
            </div>

            {/* Lokasi */}
            <div className="flex gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-850 pt-4 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Tempat/Lokasi</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{event.location || "Lokasi tidak ditentukan"}</p>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 border-b pb-2 border-slate-100 dark:border-slate-850">
              Deskripsi Kegiatan
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
              {event.description || "Tidak ada deskripsi untuk kegiatan ini."}
            </p>
          </div>

          {/* Profil Penyelenggara */}
          {pubProfile && (
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                Penyelenggara Kegiatan
              </h3>
              <div className="flex flex-col sm:flex-row gap-5 items-start bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                {pubProfile.org_logo ? (
                  <img
                    src={pubProfile.org_logo}
                    alt={pubProfile.org_name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xl">
                    {pubProfile.org_abbreviation || pubProfile.org_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                    {pubProfile.org_name} {pubProfile.org_abbreviation && `(${pubProfile.org_abbreviation})`}
                  </h4>
                  {pubProfile.phone && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <strong>Telepon/WhatsApp:</strong> {pubProfile.phone}
                    </p>
                  )}
                  {pubProfile.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 leading-normal">
                      <strong>Alamat:</strong> {pubProfile.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
