"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { approvePublisher, rejectPublisher, superadminDeletePublisher } from "../actions";

interface PublisherItem {
  id: string;
  status: "pending" | "approve" | "reject";
  reject_reason: string | null;
  org_name: string;
  org_logo: string | null;
  org_abbreviation: string | null;
  phone: string | null;
  address: string | null;
}

interface PublishersListProps {
  initialPublishers: PublisherItem[];
}

export default function PublishersList({ initialPublishers }: PublishersListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPublisher, setSelectedPublisher] = useState<PublisherItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleDeletePublisher = async (id: string, name: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus akun publisher "${name}" secara PERMANEN?\n\nAksi ini akan menghapus akun login auth, profil instansi, beserta seluruh event yang mereka daftarkan selamanya dari database.`
      )
    ) {
      startTransition(async () => {
        const res = await superadminDeletePublisher(id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const handleApprove = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menyetujui pendaftaran ${name}?`)) {
      startTransition(async () => {
        const res = await approvePublisher(id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const openRejectModal = (pub: PublisherItem) => {
    setSelectedPublisher(pub);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublisher) return;

    if (rejectReason.trim().length === 0) {
      alert("Alasan penolakan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await rejectPublisher(selectedPublisher.id, rejectReason);
      if (res.success) {
        setShowRejectModal(false);
        setSelectedPublisher(null);
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {initialPublishers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                  <th className="py-4 px-6">Instansi / Organisasi</th>
                  <th className="py-4 px-6">Kontak</th>
                  <th className="py-4 px-6">Alamat</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {initialPublishers.map((pub) => {
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
                    <tr key={pub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition align-top">
                      
                      {/* Nama & Logo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {pub.org_logo ? (
                            <img
                              src={pub.org_logo}
                              alt={pub.org_name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {pub.org_abbreviation || pub.org_name[0]}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{pub.org_name}</h4>
                            {pub.org_abbreviation && (
                              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
                                {pub.org_abbreviation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-medium">
                        {pub.phone || "-"}
                      </td>

                      {/* Alamat */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {pub.address || "-"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusStyles[pub.status]}`}>
                          {statusLabels[pub.status]}
                        </span>
                        {pub.status === "reject" && pub.reject_reason && (
                          <p className="text-[10px] text-red-500 mt-1 italic max-w-xs mx-auto line-clamp-1" title={pub.reject_reason}>
                            Alasan: "{pub.reject_reason}"
                          </p>
                        )}
                      </td>

                      {/* Tindakan */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2 text-xs font-bold items-center">
                          {pub.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(pub.id, pub.org_name)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg text-white bg-accent-600 hover:bg-accent-700 transition cursor-pointer disabled:opacity-50"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => openRejectModal(pub)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg text-white bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {pub.status === "approve" && (
                            <button
                              onClick={() => openRejectModal(pub)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-950 text-red-600 transition cursor-pointer disabled:opacity-50"
                            >
                              Tolak Akun
                            </button>
                          )}
                          {pub.status === "reject" && (
                            <button
                              onClick={() => handleApprove(pub.id, pub.org_name)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg border border-accent-200 hover:bg-accent-50 dark:border-accent-950 text-accent-600 transition cursor-pointer disabled:opacity-50"
                            >
                              Setujui Akun
                            </button>
                          )}

                          <Link
                            href={`/superadmin/publishers/${pub.id}/edit`}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition"
                          >
                            Edit
                          </Link>
                          
                          <button
                            onClick={() => handleDeletePublisher(pub.id, pub.org_name)}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Publisher</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daftar publisher baru akan otomatis muncul di sini setelah mereka mendaftar.</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Tolak Pendaftaran Akun
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Berikan alasan penolakan untuk {selectedPublisher.org_name}. Alasan ini akan tampil saat mereka mencoba login.
              </p>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Alasan Penolakan
                </label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Dokumen logo instansi tidak valid atau nama instansi tidak terdaftar resmi..."
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
                  {isPending ? "Memproses..." : "Tolak Pendaftaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
