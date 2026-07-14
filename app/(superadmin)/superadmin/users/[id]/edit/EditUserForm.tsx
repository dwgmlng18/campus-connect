"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { superadminUpdateUser } from "../../../actions";

interface EditUserFormProps {
  user: {
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
  };
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Dynamic UI States
  const [role, setRole] = useState<"superadmin" | "publisher">(user.role);
  const [status, setStatus] = useState<"pending" | "approve" | "reject">(user.status);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran logo instansi maksimal adalah 2MB.");
        e.target.value = "";
        setLogoName("");
        setLogoPreview(null);
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        setError("Format berkas harus berupa gambar.");
        e.target.value = "";
        setLogoName("");
        setLogoPreview(null);
        return;
      }
      
      setError(null);
      setLogoName(file.name);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelNewLogo = () => {
    setLogoName("");
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const selectedStatus = formData.get("status") as string;
    const reason = formData.get("reject_reason") as string;

    if (role === "publisher" && !formData.get("org_name")) {
      setError("Nama Instansi wajib diisi untuk akun Publisher.");
      return;
    }

    if (selectedStatus === "reject" && (!reason || reason.trim().length === 0)) {
      setError("Alasan penolakan akun wajib diisi jika status diubah ke 'Ditolak'.");
      return;
    }

    startTransition(async () => {
      const res = await superadminUpdateUser(user.id, formData);
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          router.push("/superadmin/users");
          router.refresh();
        }, 1500);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md p-6 sm:p-10 transition">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-accent-50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 text-accent-600 dark:text-accent-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="current_org_logo" value={user.org_logo || ""} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Email (Read Only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email Akun (Read-only)
            </label>
            <input
              readOnly
              type="email"
              value={user.email}
              className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-sm focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Role Akun
            </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition cursor-pointer"
            >
              <option value="publisher">Publisher (Penyelenggara Event)</option>
              <option value="superadmin">Superadmin (Administrator Platform)</option>
            </select>
          </div>

          {/* Publisher Specific Fields */}
          {role === "publisher" && (
            <>
              {/* Nama Instansi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nama Instansi / Organisasi
                </label>
                <input
                  required
                  name="org_name"
                  type="text"
                  defaultValue={user.org_name}
                  placeholder="Contoh: BEM Fakultas Ilmu Komputer"
                  className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              {/* Singkatan Instansi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Singkatan / Akronim (Opsional)
                </label>
                <input
                  name="org_abbreviation"
                  type="text"
                  defaultValue={user.org_abbreviation || ""}
                  placeholder="Contoh: BEM FASILKOM"
                  className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              {/* Nomor Telepon */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  name="phone"
                  type="text"
                  defaultValue={user.phone || ""}
                  placeholder="Contoh: 08123456789"
                  className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              {/* Alamat Sekretariat */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Alamat Sekretariat
                </label>
                <input
                  name="address"
                  type="text"
                  defaultValue={user.address || ""}
                  placeholder="Contoh: Gedung Kemahasiswaan lt. 2"
                  className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </>
          )}

          {/* Status Akun */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status Akun
            </label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition cursor-pointer font-bold"
            >
              <option value="pending">Pending (Menunggu Ulasan)</option>
              <option value="approve">Disetujui (Approved / Aktif)</option>
              <option value="reject">Ditolak (Rejected / Nonaktif)</option>
            </select>
          </div>

          {/* Alasan Penolakan (Hanya muncul jika status diubah ke 'reject') */}
          {status === "reject" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Alasan Penolakan Akun
              </label>
              <textarea
                name="reject_reason"
                rows={3}
                defaultValue={user.reject_reason || ""}
                placeholder="Tulis alasan mengapa pendaftaran akun ditolak atau dinonaktifkan..."
                className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-950 bg-red-50/10 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none font-medium"
              />
            </div>
          )}

          {/* Logo Instansi dengan Pratinjau (Hanya jika role = publisher) */}
          {role === "publisher" && (
            <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {logoPreview ? "Pratinjau Logo Baru" : "Logo Instansi"}
                  </label>
                  {logoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 flex flex-col items-center">
                      <img
                        src={logoPreview}
                        alt="Logo Baru"
                        className="w-24 h-24 object-cover rounded-full border border-slate-200 dark:border-slate-850"
                      />
                      <div className="mt-3 flex items-center justify-between w-full px-2">
                        <span className="text-xs text-slate-500 truncate max-w-[120px]" title={logoName}>
                          {logoName}
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelNewLogo}
                          className="px-2 py-0.5 text-[10px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-transparent rounded-lg transition cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : user.org_logo ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 p-3 max-w-[150px] flex flex-col items-center">
                      <img
                        src={user.org_logo}
                        alt="Logo Saat Ini"
                        className="w-24 h-24 object-cover rounded-full border border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400 mt-2 text-center">Logo saat ini</p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 flex items-center justify-center text-slate-400 text-xs h-36">
                      Belum ada logo terunggah
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-end">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Ganti Logo (Pilih untuk mengganti)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition">
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <svg className="w-6 h-6 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 px-4 text-center">
                        <span>Pilih logo instansi baru</span>
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="org_logo"
                      name="org_logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/superadmin/users"
            className="px-5 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
