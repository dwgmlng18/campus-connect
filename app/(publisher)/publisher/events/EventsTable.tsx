"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { updateEventStatus, deleteEventPermanently } from "../actions";

interface EventItem {
  id: string;
  title: string;
  start_date: string;
  status: "active" | "inactive" | "deleted";
  approval_status: string;
}

interface EventsTableProps {
  initialEvents: EventItem[];
}

export default function EventsTable({ initialEvents }: EventsTableProps) {
  const [isPending, startTransition] = useTransition();

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
        const res = await updateEventStatus(eventId, newStatus);
        if (!res.success) {
          alert(res.message);
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
        const res = await deleteEventPermanently(eventId);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {initialEvents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="py-4 px-6">Nama Event</th>
                <th className="py-4 px-6">Tanggal Mulai</th>
                <th className="py-4 px-6 text-center">Status Review</th>
                <th className="py-4 px-6 text-center">Status Operasional</th>
                <th className="py-4 px-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {initialEvents.map((event) => {
                const formattedDate = new Date(event.start_date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

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
                      <div className="flex justify-end gap-3 text-xs font-bold items-center">
                        <Link
                          href={`/publisher/events/${event.id}`}
                          className="text-slate-500 hover:text-primary-600 transition"
                        >
                          Detail
                        </Link>
                        {event.status !== "deleted" ? (
                          <>
                            <Link
                              href={`/publisher/events/${event.id}/edit`}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition"
                            >
                              Edit
                            </Link>
                            
                            {/* Toggle Aktif / Nonaktif */}
                            {event.status === "active" ? (
                              <button
                                onClick={() => handleStatusChange(event.id, "inactive")}
                                disabled={isPending}
                                className="text-amber-600 hover:text-amber-700 transition cursor-pointer disabled:opacity-50"
                              >
                                Nonaktifkan
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(event.id, "active")}
                                disabled={isPending}
                                className="text-accent-600 hover:text-accent-700 transition cursor-pointer disabled:opacity-50"
                              >
                                Aktifkan
                              </button>
                            )}

                            {/* Tombol Hapus (Soft Delete) */}
                            <button
                              onClick={() => handleStatusChange(event.id, "deleted")}
                              disabled={isPending}
                              className="text-red-600 hover:text-red-700 transition cursor-pointer disabled:opacity-50"
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
