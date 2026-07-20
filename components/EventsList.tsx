"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EventItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  org_name: string;
  approval_status: "pending" | "approve" | "reject";
  reject_reason: string | null;
}

interface EventsListProps {
  initialEvents: EventItem[];
}

export default function EventsList({ initialEvents }: EventsListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const router = useRouter();

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempDateFilter, setTempDateFilter] = useState("all");
  const [tempStatusFilter, setTempStatusFilter] = useState("all");

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setDateFilter(tempDateFilter);
    setStatusFilter(tempStatusFilter);
  };

  const handleResetFilters = () => {
    setTempSearchTerm("");
    setTempDateFilter("all");
    setTempStatusFilter("all");
    setSearchTerm("");
    setDateFilter("all");
    setStatusFilter("all");
  };

  const handleApprove = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menyetujui event "${name}"?`)) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/superadmin/events/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: "" }),
          });
          const res = await response.json();
          if (res.success) {
            router.refresh();
          } else {
            alert(res.message);
          }
        } catch (err) {
          alert("Gagal menyetujui event.");
        }
      });
    }
  };

  const openRejectModal = (event: EventItem) => {
    setSelectedEvent(event);
    setRejectReason(event.reject_reason || "");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/superadmin/events/${selectedEvent.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        });
        const res = await response.json();
        if (res.success) {
          setShowRejectModal(false);
          setSelectedEvent(null);
          router.refresh();
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Gagal menolak event.");
      }
    });
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus event "${title}" secara PERMANEN?\n\nAksi ini tidak dapat dibatalkan.`
      )
    ) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/superadmin/events/${id}`, {
            method: "DELETE",
          });
          const res = await response.json();
          if (res.success) {
            router.refresh();
          } else {
            alert(res.message);
          }
        } catch (err) {
          alert("Gagal menghapus event secara permanen.");
        }
      });
    }
  };

  const filteredEvents = initialEvents.filter((event) => {
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchTitle = event.title.toLowerCase().includes(term);
      const matchOrg = event.org_name.toLowerCase().includes(term);
      if (!matchTitle && !matchOrg) return false;
    }

    if (statusFilter !== "all" && event.approval_status !== statusFilter) {
      return false;
    }

    if (dateFilter !== "all") {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

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
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between transition-colors duration-200">
        
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <input
            type="text"
            placeholder="Cari judul event atau nama penyelenggara..."
            value={tempSearchTerm}
            onChange={(e) => setTempSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          />
          <svg className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap w-full lg:w-auto gap-3 items-center justify-between lg:justify-end">
          <div className="flex gap-2">
            <select
              value={tempStatusFilter}
              onChange={(e) => setTempStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="approve">Disetujui (Approved)</option>
              <option value="reject">Ditolak (Rejected)</option>
            </select>

            <select
              value={tempDateFilter}
              onChange={(e) => setTempDateFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="this_week">7 Hari ke Depan</option>
              <option value="this_month">Bulan Ini</option>
              <option value="upcoming">Akan Datang</option>
              <option value="past">Sudah Terlewat</option>
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleApplyFilters}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Terapkan Filter
            </button>
            
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                  <th className="py-4 px-6">Judul Event</th>
                  <th className="py-4 px-6">Penyelenggara</th>
                  <th className="py-4 px-6">Waktu Kegiatan</th>
                  <th className="py-4 px-6 text-center">Status Review</th>
                  <th className="py-4 px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredEvents.map((event) => {
                  const formattedStartDate = new Date(event.start_date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  const formattedEndDate = event.end_date
                    ? new Date(event.end_date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                  const statusStyles = {
                    approve: "bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400 border-accent-200 dark:border-accent-850",
                    pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500 border-amber-200 dark:border-amber-850",
                    reject: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500 border-red-200 dark:border-red-850",
                  };

                  const statusLabels = {
                    approve: "Disetujui",
                    pending: "Menunggu",
                    reject: "Ditolak",
                  };

                  return (
                    <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition align-top">
                      
                      {/* Judul */}
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        <Link href={`/superadmin/events/${event.id}`} className="hover:text-primary-600 transition line-clamp-1" title={event.title}>
                          {event.title}
                        </Link>
                      </td>

                      {/* Penyelenggara */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-medium">
                        {event.org_name}
                      </td>

                      {/* Tanggal */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {formattedStartDate}
                        </div>
                        {formattedEndDate && (
                          <div className="text-xs text-slate-400 mt-1 italic">
                            s.d. {formattedEndDate}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusStyles[event.approval_status]}`}>
                          {statusLabels[event.approval_status]}
                        </span>
                        {event.approval_status === "reject" && event.reject_reason && (
                          <p className="text-[10px] text-red-500 mt-1 italic max-w-xs mx-auto line-clamp-1" title={event.reject_reason}>
                            Catatan: "{event.reject_reason}"
                          </p>
                        )}
                      </td>

                      {/* Tindakan */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2 text-xs font-bold items-center">
                          <Link
                            href={`/superadmin/events/${event.id}`}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition"
                          >
                            Detail
                          </Link>

                          <Link
                            href={`/superadmin/events/${event.id}/edit`}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition"
                          >
                            Edit
                          </Link>

                          {event.approval_status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(event.id, event.title)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg text-white bg-accent-600 hover:bg-accent-700 transition cursor-pointer disabled:opacity-50"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => openRejectModal(event)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg text-white bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {event.approval_status === "approve" && (
                            <button
                              onClick={() => openRejectModal(event)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer disabled:opacity-50"
                            >
                              Tolak Event
                            </button>
                          )}
                          {event.approval_status === "reject" && (
                            <button
                              onClick={() => handleApprove(event.id, event.title)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg border border-accent-200 hover:bg-accent-50 text-accent-600 transition cursor-pointer disabled:opacity-50"
                            >
                              Setujui Event
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.title)}
                            disabled={isPending}
                            className="px-2.5 py-1.5 rounded-lg text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-transparent transition cursor-pointer disabled:opacity-50"
                          >
                            Hapus
                          </button>
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
            <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">Event Tidak Ditemukan</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sesuaikan kata kunci pencarian atau filter yang Anda terapkan.</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Tolak Pengajuan Event
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Berikan catatan alasan mengapa event "{selectedEvent.title}" ditolak. Alasan ini akan dikirimkan kepada penyelenggara.
              </p>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Catatan Alasan Penolakan
                </label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Deskripsi kegiatan kurang lengkap atau poster mengandung unsur yang tidak pantas..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Memproses..." : "Tolak Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
