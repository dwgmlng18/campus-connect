import React, { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import FilterBar from "@/components/FilterBar";
import PublicLayout from "@/components/PublicLayout";

export const revalidate = 0; // Memastikan data real-time saat halaman diakses

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    date?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const supabaseAdmin = await createAdminClient();

  const nowIso = new Date().toISOString();

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

  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const category = resolvedParams.category || "";
  const dateFilter = resolvedParams.date || "";
  const { data: categories = [] } = await supabaseAdmin
    .from("event_categories")
    .select("id, name")
    .order("name", { ascending: true });
  let query = supabaseAdmin
    .from("events")
    .select(`
      id,
      title,
      description,
      location,
      start_date,
      end_date,
      poster_image,
      category:event_categories(name),
      profiles:created_by(
        profiles(org_name, org_logo, org_abbreviation)
      ),
      approvals:event_approvals(status, created_at)
    `)
    .eq("status", "active");

  if (category) {
    query = query.eq("category_id", category);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  query = query.order("start_date", { ascending: true });
  const { data: rawEvents = [] } = await query;

  const getLatestApprovalStatus = (approvalsList: any[]) => {
    if (!approvalsList || approvalsList.length === 0) return "pending";
    const sorted = [...approvalsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const events = (rawEvents || []).filter((event: any) => {
    const isApproved = getLatestApprovalStatus(event.approvals || []) === "approve";
    if (!isApproved) return false;
    if (dateFilter) {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

      if (dateFilter === "today") {
        if (!(eventStart <= todayEnd && eventEnd >= todayStart)) return false;
      } else if (dateFilter === "this_week") {
        const weekEnd = new Date(todayStart);
        weekEnd.setDate(todayStart.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);
        if (!(eventStart <= weekEnd && eventEnd >= todayStart)) return false;
      } else if (dateFilter === "this_month") {
        const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
        const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        if (!(eventStart <= monthEnd && eventEnd >= monthStart)) return false;
      } else if (dateFilter === "upcoming") {
        if (!(eventEnd >= todayStart)) return false;
      } else if (dateFilter === "past") {
        if (!(eventEnd < todayStart)) return false;
      }
    }

    return true;
  });

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header Halaman */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Daftar Event Kampus
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Cari, saring, dan temukan kegiatan mahasiswa terbaik
          </p>
        </div>

        {/* Bagian Filter */}
        <div className="mb-10">
          <Suspense fallback={<div className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>}>
            <FilterBar categories={categories || []} />
          </Suspense>
        </div>

        {/* Tampilan Grid Event */}
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event: any) => {
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
                    {event.category?.name && (
                      <span className="absolute top-4 left-4 px-2.5 py-1 text-xs font-semibold text-white bg-slate-950/70 backdrop-blur-sm rounded-lg">
                        {event.category.name}
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Penyelenggara */}
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

                    {/* Waktu & Lokasi */}
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
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full">
            <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">Event Tidak Ditemukan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
