"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { approveEvent, rejectEvent, superadminDeleteEvent } from "../actions";

interface EventItem {
  id: string;
  title: string;
  start_date: string;
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

  const handleDeleteEvent = async (id: string, title: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus event "${title}" secara PERMANEN?\n\nAksi ini akan menghapus seluruh data event dari sistem dan tidak dapat dipulihkan.`
      )
    ) {
      startTransition(async () => {
        const res = await superadminDeleteEvent(id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const handleApprove = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menyetujui event "${title}"?`)) {
      startTransition(async () => {
        const res = await approveEvent(id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const openRejectModal = (event: EventItem) => {
    setSelectedEvent(event);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (rejectReason.trim().length === 0) {
      alert("Alasan penolakan event wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await rejectEvent(selectedEvent.id, rejectReason);
      if (res.success) {
        setShowRejectModal(false);
        setSelectedEvent(null);
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {initialEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                  <th className="py-4 px-6">Judul Event</th>
                  <th className="py-4 px-6">Penyelenggara</th>
                  <th className="py-4 px-6">Tanggal Mulai</th>
                  <th className="py-4 px-6 text-center">Status Review</th>
                  <th className="py-4 px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {initialEvents.map((event) => {
                  const formattedDate = new Date(event.start_date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

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
                        {formattedDate}
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
                            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            Detail
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
            <h4 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Pengajuan Event</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pengajuan event kampus baru dari publisher akan otomatis terdaftar di sini.</p>
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
