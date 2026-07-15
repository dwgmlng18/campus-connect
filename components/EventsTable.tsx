"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EventItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  status: "active" | "inactive" | "deleted";
  approval_status: string;
}

interface EventsTableProps {
  initialEvents: EventItem[];
}

export default function EventsTable({ initialEvents }: EventsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const router = useRouter();

  const handleStatusChange = async (
    eventId: string,
    newStatus: "active" | "inactive" | "deleted",
    currentStatus?: "active" | "inactive" | "deleted"
  ) => {
    let confirmMsg = "";
    if (newStatus === "deleted") {
      confirmMsg = "Apakah Anda yakin ingin menghapus sementara event ini? Event akan dipindahkan ke daftar terhapus.";
    } else if (newStatus === "inactive") {
      confirmMsg = "Apakah Anda yakin ingin menonaktifkan event ini dari halaman publik?";
    } else if (currentStatus === "deleted" && newStatus === "active") {
      confirmMsg = "Apakah Anda yakin ingin memulihkan kembali event ini agar aktif kembali?";
    } else {
      confirmMsg = "Apakah Anda yakin ingin mengaktifkan kembali event ini?";
    }

    if (confirm(confirmMsg)) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/publisher/events/${eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          const res = await response.json();
          if (res.success) {
            router.refresh();
          } else {
            alert(res.message);
          }
        } catch (err) {
          alert("Terjadi kesalahan sistem saat memperbarui status event.");
        }
      });
    }
  };

  const handlePermanentDelete = async (eventId: string, eventTitle: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus event "${eventTitle}" secara PERMANEN?\n\nTindakan ini akan menghapus data selamanya dari database dan tidak dapat dipulihkan kembali.`
      )
    ) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/publisher/events/${eventId}`, {
            method: "DELETE",
          });
          const res = await response.json();
          if (res.success) {
            router.refresh();
          } else {
            alert(res.message);
          }
        } catch (err) {
          alert("Terjadi kesalahan sistem saat menghapus event secara permanen.");
        }
      });
    }
  };

  // Filter Event
  const filteredEvents = initialEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;

    const eventStart = new Date(event.start_date);
    const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (dateFilter === "today") {
      return eventStart <= todayEnd && eventEnd >= todayStart;
    }

    if (dateFilter === "this_week") {
      const weekEnd = new Date(todayStart);
      weekEnd.setDate(todayStart.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);
      return eventStart <= weekEnd && eventEnd >= todayStart;
    }

    if (dateFilter === "this_month") {
      const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      return eventStart <= monthEnd && eventEnd >= monthStart;
    }

    if (dateFilter === "upcoming") {
      return eventEnd >= todayStart;
    }

    if (dateFilter === "past") {
      return eventEnd < todayStart;
    }

    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Filter & Pencarian */}
      {initialEvents.length > 0 && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari nama event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-150"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto items-center">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">Filter Tanggal:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-150 cursor-pointer"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="this_week">7 Hari ke Depan</option>
              <option value="this_month">Bulan Ini</option>
              <option value="upcoming">Akan Datang</option>
              <option value="past">Sudah Terlewat</option>
            </select>
          </div>
        </div>
      )}

      {initialEvents.length > 0 ? (
        <>
          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="py-4 px-6">Nama Event</th>
                    <th className="py-4 px-6">Waktu Kegiatan</th>
                    <th className="py-4 px-6 text-center">Status Review</th>
                    <th className="py-4 px-6 text-center">Status Operasional</th>
                    <th className="py-4 px-6 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredEvents.map((event) => {
                    const formattedStartDate = new Date(event.start_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });

                    const formattedEndDate = event.end_date
                      ? new Date(event.end_date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : null;

                    // Status Review (Approval)
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

                    // Status Operasional (events.status)
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
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {formattedStartDate}
                          </div>
                          {formattedEndDate && (
                            <div className="text-xs text-slate-400 mt-1 italic">
                              s.d. {formattedEndDate}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${approvalStyles[event.approval_status as keyof typeof approvalStyles]}`}>
                            {approvalLabels[event.approval_status as keyof typeof approvalLabels]}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${operationalStyles[event.status]}`}>
                            {operationalLabels[event.status]}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 text-xs font-bold items-center">
                            
                            {/* Tombol ke Detail */}
                            <Link
                              href={`/events/${event.id}`}
                              className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              Detail
                            </Link>

                            {event.status !== "deleted" ? (
                              <>
                                {/* Tombol ke Edit */}
                                <Link
                                  href={`/publisher/events/${event.id}/edit`}
                                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                  Edit
                                </Link>

                                {/* Tombol Toggle Status (Aktif/Nonaktif) */}
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      event.id,
                                      event.status === "active" ? "inactive" : "active"
                                    )
                                  }
                                  disabled={isPending}
                                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50 ${
                                    event.status === "active"
                                      ? "text-slate-600 hover:text-amber-600 hover:bg-slate-100"
                                      : "text-slate-600 hover:text-accent-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {event.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                                </button>

                                {/* Tombol Soft Delete */}
                                <button
                                  onClick={() => handleStatusChange(event.id, "deleted")}
                                  disabled={isPending}
                                  className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer disabled:opacity-50"
                                >
                                  Hapus
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Tombol Pulihkan dari Soft Delete */}
                                <button
                                  onClick={() => handleStatusChange(event.id, "active", "deleted")}
                                  disabled={isPending}
                                  className="text-accent-600 hover:text-accent-700 transition cursor-pointer disabled:opacity-50"
                                >
                                  Pulihkan
                                </button>

                                {/* Tombol Hapus Permanen */}
                                <button
                                  onClick={() => handlePermanentDelete(event.id, event.title)}
                                  disabled={isPending}
                                  className="text-red-600 hover:text-red-700 transition cursor-pointer disabled:opacity-50"
                                >
                                  Hapus Permanen
                                </button>
                              </>
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
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h4 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">Tidak Menemukan Event</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter tanggal Anda.</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h4 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Event Kampus</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Buat event pertama Anda dengan menekan tombol "Tambah Event Baru".</p>
        </div>
      )}
    </div>
  );
}
