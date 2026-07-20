import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PublicLayout from "@/components/PublicLayout";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const supabase = await createClient();

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
  const isApproved = approvalInfo.status === "approve";

  const { data: { user } } = await supabase.auth.getUser();
  let userRole = null;
  if (user) {
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = dbUser?.role || null;
  }

  const isOwner = user && event.created_by === user.id;
  const isAdmin = userRole === "superadmin";

  if (!isApproved && !isOwner && !isAdmin) {
    notFound();
  }

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
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Tombol Kembali */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Event
        </Link>

        {/* Banner status review untuk Owner & Admin */}
        {!isApproved && (
          <div className={`mb-8 p-4 rounded-2xl border text-sm font-semibold flex items-start gap-3 ${
            approvalInfo.status === "reject"
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-900/50"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50"
          }`}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">
                {approvalInfo.status === "reject" ? "Detail Event (Ditolak Admin)" : "Pratinjau Event (Belum Disetujui Admin)"}
              </p>
              {approvalInfo.status === "reject" && approvalInfo.note && (
                <p className="text-xs font-medium mt-1">Alasan Penolakan: "{approvalInfo.note}"</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none transition-colors duration-200">
          {/* Gambar Poster Besar */}
          <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-850 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
            {event.poster_image ? (
              <img
                src={event.poster_image}
                alt={event.title}
                className="object-contain w-full h-full max-h-[450px]"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold">Tidak Ada Poster Kegiatan</span>
              </div>
            )}
          </div>

          {/* Konten Utama */}
          <div className="p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {event.category?.name && (
                <span className="px-3 py-1 rounded-full text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 uppercase tracking-wide">
                  {event.category.name}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Informasi Waktu & Lokasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Waktu Pelaksanaan
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    Mulai: {formattedStartDate}
                  </p>
                  {formattedEndDate && (
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      Selesai: {formattedEndDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Lokasi Kegiatan
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {event.location || "Lokasi tidak disebutkan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                Deskripsi Event
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed whitespace-pre-line">
                {event.description || "Tidak ada deskripsi untuk kegiatan ini."}
              </p>
            </div>

            {/* Profil Penyelenggara */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Penyelenggara Kegiatan
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {pubProfile?.org_logo ? (
                  <img
                    src={pubProfile.org_logo}
                    alt={pubProfile.org_name}
                    className="w-16 h-16 rounded-2xl border border-slate-100 dark:border-slate-800 object-cover shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xl font-bold border border-primary-100 dark:border-slate-800 flex-shrink-0">
                    {pubProfile?.org_abbreviation || (pubProfile?.org_name ? pubProfile.org_name[0] : "P")}
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {pubProfile?.org_name || "Nama Instansi tidak diisi"}
                  </h4>
                  {pubProfile?.org_abbreviation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      {pubProfile.org_abbreviation}
                    </p>
                  )}
                  
                  {/* Kontak */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {pubProfile?.phone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {pubProfile.phone}
                      </span>
                    )}
                    {pubProfile?.address && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {pubProfile.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
