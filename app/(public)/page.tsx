import React from "react";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0; // Disable caching for real-time updates

export default async function HomePage() {
  // Gunakan admin client untuk bypass RLS select loop pada data publik
  const supabaseAdmin = await createAdminClient();

  // Ambil event dari database dengan kueri status active
  const { data: rawEvents } = await supabaseAdmin
    .from("events")
    .select(`
      id,
      title,
      location,
      start_date,
      poster_image,
      category:event_categories(name),
      profiles:created_by(
        profiles(org_name, org_logo, org_abbreviation)
      ),
      approvals:event_approvals(status, created_at)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Cari status review terbaru untuk setiap event
  const getLatestApprovalStatus = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) return "pending";
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  // Hanya tampilkan event yang aktif dan telah disetujui (approve), batas 3 terbaru
  const featuredEvents = (rawEvents || [])
    .filter((event: any) => getLatestApprovalStatus(event.approvals || []) === "approve")
    .slice(0, 3);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden py-24 px-4 sm:px-6 lg:px-8 text-center bg-radial from-primary-500/10 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 animate-pulse">
            Pusat Informasi Kegiatan Kampus
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 dark:from-slate-100 dark:via-primary-400 dark:to-slate-100 bg-clip-text text-transparent pb-2">
            Temukan & Publikasikan Kegiatan Kampus Terbaik
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium">
            Campus Connect mempertemukan mahasiswa dengan berbagai event menarik—mulai dari seminar akademik, lomba inovatif, hingga workshop keahlian praktis.
          </p>

          {/* Form Pencarian Cepat */}
          <form action="/events" method="GET" className="mt-6 flex w-full max-w-lg items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
            <input
              name="search"
              type="text"
              placeholder="Cari seminar, lomba, atau workshop..."
              className="flex-grow px-4 py-3 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
            >
              Cari
            </button>
          </form>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200">
              Event Terbaru
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kegiatan kampus terbaru yang siap Anda ikuti
            </p>
          </div>
          <Link href="/events" className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition flex items-center gap-1">
            Lihat Semua
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {featuredEvents && featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event: any) => {
              // Menghubungkan relasi publisher lewat profiles
              const pubProfile = event.profiles?.profiles;
              const formattedDate = new Date(event.start_date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <div
                  key={event.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl dark:shadow-none hover:-translate-y-1 transition duration-300 flex flex-col"
                >
                  {/* Poster Event */}
                  <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {event.poster_image ? (
                      <img
                        src={event.poster_image}
                        alt={event.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-slate-400 bg-slate-200 dark:bg-slate-800">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badge Kategori */}
                    {event.category?.name && (
                      <span className="absolute top-4 left-4 px-2.5 py-1 text-xs font-semibold text-white bg-slate-950/70 backdrop-blur-sm rounded-lg">
                        {event.category.name}
                      </span>
                    )}
                  </div>

                  {/* Konten Card */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Info Penyelenggara */}
                    <div className="flex items-center gap-3 mb-4">
                      {pubProfile?.org_logo ? (
                        <img
                          src={pubProfile.org_logo}
                          alt={pubProfile.org_name}
                          className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {pubProfile?.org_abbreviation || (pubProfile?.org_name ? pubProfile.org_name[0] : "P")}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {pubProfile?.org_name || "Penyelenggara"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition line-clamp-2">
                      <Link href={`/events/${event.id}`}>
                        {event.title}
                      </Link>
                    </h3>

                    {/* Informasi Waktu & Tempat */}
                    <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-1">{event.location || "Lokasi Daring/Luring"}</span>
                      </div>
                    </div>

                    {/* Tombol Detail */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-xs font-bold text-primary-600 group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300 transition flex items-center gap-1"
                      >
                        Detail Event
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">Tidak Ada Event Kampus</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Belum ada event kampus yang tayang saat ini.</p>
          </div>
        )}
      </section>

      {/* Call to Action Section */}
      <section className="w-full bg-primary-600 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8 mt-12 text-center text-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Apakah Organisasi Kampus Anda Ingin Publikasi Event?</h2>
          <p className="max-w-xl text-slate-100 dark:text-slate-300">
            Daftarkan diri Anda sebagai Publisher resmi. Buat event kampus, ajukan persetujuan superadmin, dan publikasikan secara meluas kepada mahasiswa!
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-semibold bg-white text-primary-600 hover:bg-slate-50 dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700 rounded-xl transition shadow-md"
            >
              Mulai Daftar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
