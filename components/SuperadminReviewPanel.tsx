"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface ReviewPanelProps {
  eventId: string;
  eventTitle: string;
  currentStatus: "pending" | "approve" | "reject";
  rejectReason: string | null;
}

export default function SuperadminReviewPanel({ eventId, eventTitle, currentStatus, rejectReason }: ReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    setSuccess(null);
    if (!confirm(`Apakah Anda yakin ingin menyetujui event "${eventTitle}"? Event ini akan langsung ditayangkan secara publik.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/superadmin/events/${eventId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: "" }),
        });
        const res = await response.json();
        if (res.success) {
          setSuccess(res.message);
          router.refresh();
        } else {
          setError(res.message || "Gagal menyetujui event.");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan sistem saat menyetujui event.");
      }
    });
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/superadmin/events/${eventId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        const res = await response.json();
        if (res.success) {
          setSuccess(res.message);
          setShowRejectForm(false);
          setReason("");
          router.refresh();
        } else {
          setError(res.message || "Gagal menolak event.");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan sistem saat menolak event.");
      }
    });
  };

  // Status badge styling
  const statusStyles = {
    approve: "bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400 border-accent-200",
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500 border-amber-200",
    reject: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500 border-red-200",
  };

  const statusLabels = {
    approve: "Disetujui & Tayang",
    pending: "Menunggu Penilaian",
    reject: "Ditolak",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-md mb-8 transition-colors duration-200">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-850">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Penilaian Kelayakan Event
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sebagai Superadmin, Anda berhak menyetujui agar event tayang atau menolaknya jika melanggar ketentuan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase">Status Saat Ini:</span>
          <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${statusStyles[currentStatus]}`}>
            {statusLabels[currentStatus]}
          </span>
        </div>
      </div>

      {/* Alert Error / Success */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-4 rounded-xl bg-accent-50 dark:bg-accent-950/20 border border-accent-200 dark:border-accent-900/50 text-accent-600 dark:text-accent-400 text-xs font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Catatan Penolakan Lama (Jika Ditolak) */}
      {currentStatus === "reject" && rejectReason && !showRejectForm && (
        <div className="mt-4 p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">
          <p className="font-bold mb-1">Catatan Penolakan Sebelumnya:</p>
          <p className="italic">"{rejectReason}"</p>
        </div>
      )}

      {/* Panel Tombol Aksi */}
      {!showRejectForm && (
        <div className="flex flex-wrap gap-3 mt-5">
          {currentStatus !== "approve" && (
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-accent-600 hover:bg-accent-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Setujui Event
            </button>
          )}

          <button
            onClick={() => {
              setShowRejectForm(true);
              setReason(rejectReason || "");
            }}
            disabled={isPending}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
              currentStatus === "approve"
                ? "text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-transparent"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {currentStatus === "reject" ? "Ubah Catatan Penolakan" : "Tolak Event"}
          </button>
        </div>
      )}

      {/* Form Penolakan (Muncul saat Klik Tolak) */}
      {showRejectForm && (
        <form onSubmit={handleRejectSubmit} className="mt-5 space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Berikan Alasan Penolakan Event
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Deskripsi kegiatan kurang detail atau poster terunggah salah berkas..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Memproses..." : "Simpan & Tolak Event"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
