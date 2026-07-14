"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { approvePublisher, rejectPublisher, superadminDeleteUser } from "../actions";

interface UserItem {
  id: string;
  role: "superadmin" | "publisher";
  status: "pending" | "approve" | "reject";
  reject_reason: string | null;
  email: string;
  org_name: string;
  org_logo: string | null;
  org_abbreviation: string | null;
  phone: string | null;
  address: string | null;
}

interface UsersListProps {
  initialUsers: UserItem[];
}

export default function UsersList({ initialUsers }: UsersListProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menyetujui akun "${name}"?`)) {
      startTransition(async () => {
        const res = await approvePublisher(id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const openRejectModal = (user: UserItem) => {
    setSelectedUser(user);
    setRejectReason(user.reject_reason || "");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    startTransition(async () => {
      const res = await rejectPublisher(selectedUser.id, rejectReason);
      if (res.success) {
        setShowRejectModal(false);
        setSelectedUser(null);
      } else {
        alert(res.message);
      }
    });
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus akun "${name}" secara PERMANEN?\n\nAksi ini akan menghapus akun login auth, profil instansi, beserta seluruh data terkait selamanya dari database.`
      )
    ) {
      startTransition(async () => {
        const res = await superadminDeleteUser(id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  // Filter & Search Logic
  const filteredUsers = initialUsers.filter((user) => {
    // 1. Role Filter
    if (roleFilter !== "all" && user.role !== roleFilter) return false;

    // 2. Status Filter
    if (statusFilter !== "all" && user.status !== statusFilter) return false;

    // 3. Search Term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchEmail = user.email.toLowerCase().includes(term);
      const matchName = user.org_name.toLowerCase().includes(term);
      const matchAbbrev = user.org_abbreviation?.toLowerCase().includes(term) || false;
      const matchPhone = user.phone?.toLowerCase().includes(term) || false;
      const matchAddress = user.address?.toLowerCase().includes(term) || false;

      return matchEmail || matchName || matchAbbrev || matchPhone || matchAddress;
    }

    return true;
  });

  const roleStyles = {
    superadmin: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
    publisher: "bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 border-primary-200 dark:border-primary-800",
  };

  const roleLabels = {
    superadmin: "Admin",
    publisher: "Publisher",
  };

  const statusStyles = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    approve: "bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-400 border-accent-200 dark:border-accent-800",
    reject: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const statusLabels = {
    pending: "Pending",
    approve: "Disetujui",
    reject: "Ditolak",
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors duration-200">
        
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Cari nama, singkatan, email, alamat, atau nomor telp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          />
          <svg className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap w-full md:w-auto gap-3 items-center">
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="superadmin">Superadmin</option>
              <option value="publisher">Publisher</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approve">Disetujui</option>
              <option value="reject">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                  <th className="py-4 px-6">Identitas Pengguna</th>
                  <th className="py-4 px-6 text-center">Role</th>
                  <th className="py-4 px-6">Nomor Telepon</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors duration-150">
                    
                    {/* Identitas (Nama/Organisasi + Email) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.role === "publisher" && user.org_logo ? (
                          <img
                            src={user.org_logo}
                            alt={user.org_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border flex-shrink-0 ${
                            user.role === "superadmin"
                              ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                              : "bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800"
                          }`}>
                            {user.role === "superadmin" ? "A" : (user.org_abbreviation || user.org_name[0])}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {user.org_name}
                            </span>
                            {user.org_abbreviation && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                                {user.org_abbreviation}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block truncate mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleStyles[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>

                    {/* Kontak */}
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">
                      {user.phone || "-"}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusStyles[user.status]}`}>
                        {statusLabels[user.status]}
                      </span>
                      {user.status === "reject" && user.reject_reason && (
                        <p className="text-[10px] text-red-500 mt-1 italic max-w-xs mx-auto line-clamp-1" title={user.reject_reason}>
                          Alasan: "{user.reject_reason}"
                        </p>
                      )}
                    </td>

                    {/* Tindakan */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2 text-xs font-bold items-center">
                        {/* Approval Toggles */}
                        {user.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id, user.org_name)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg text-white bg-accent-600 hover:bg-accent-700 transition cursor-pointer disabled:opacity-50"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => openRejectModal(user)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-lg text-white bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {user.status === "approve" && (
                          <button
                            onClick={() => openRejectModal(user)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-950 text-red-600 transition cursor-pointer disabled:opacity-50"
                          >
                            Tolak Akun
                          </button>
                        )}
                        {user.status === "reject" && (
                          <button
                            onClick={() => handleApprove(user.id, user.org_name)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-lg border border-accent-200 hover:bg-accent-50 dark:border-accent-950 text-accent-600 transition cursor-pointer disabled:opacity-50"
                          >
                            Setujui Akun
                          </button>
                        )}

                        {/* Detail Link */}
                        <Link
                          href={`/superadmin/users/${user.id}`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition"
                        >
                          Detail
                        </Link>

                        {/* Edit Link */}
                        <Link
                          href={`/superadmin/users/${user.id}/edit`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition"
                        >
                          Edit
                        </Link>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.org_name)}
                          disabled={isPending}
                          className="px-2.5 py-1.5 rounded-lg text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-transparent transition cursor-pointer disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">User Tidak Ditemukan</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sesuaikan kata kunci pencarian atau filter yang Anda terapkan.</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Tolak Pendaftaran / Nonaktifkan Akun
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Berikan alasan penolakan untuk {selectedUser.org_name}. Alasan ini akan tampil saat mereka mencoba login.
              </p>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Alasan Penolakan
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tulis alasan mengapa akun ditolak atau dinonaktifkan..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Memproses..." : "Tolak Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
