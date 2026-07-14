"use client";

import React, { useState, useTransition } from "react";
import { updatePublisherProfile } from "../actions";
import { updatePassword } from "@/app/login/actions";

interface ProfileData {
  org_name: string;
  org_logo: string | null;
  org_abbreviation: string | null;
  phone: string | null;
  address: string | null;
}

interface ProfileFormProps {
  profile: ProfileData;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [isPending, startTransition] = useTransition();

  // State untuk tab Profil
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");

  // State untuk tab Password
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setProfileError("Ukuran logo maksimal adalah 2MB.");
        e.target.value = "";
        setLogoName("");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setProfileError("Format berkas harus berupa gambar.");
        e.target.value = "";
        setLogoName("");
        return;
      }
      setProfileError(null);
      setLogoName(file.name);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updatePublisherProfile(formData);
      if (res.success) {
        setProfileSuccess(res.message);
        setLogoName("");
      } else {
        setProfileError(res.message);
      }
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password baru tidak cocok.");
      return;
    }

    startTransition(async () => {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setPasswordSuccess(res.message);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res.message);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md overflow-hidden transition max-w-2xl mx-auto">
      {/* Tab Header */}
      <div className="flex border-b border-slate-100 dark:border-slate-850">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-4 text-sm font-semibold border-b-2 transition duration-150 cursor-pointer ${
            activeTab === "profile"
              ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Profil Instansi
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex-1 py-4 text-sm font-semibold border-b-2 transition duration-150 cursor-pointer ${
            activeTab === "password"
              ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Ubah Password
        </button>
      </div>

      <div className="p-6 sm:p-10">
        {/* Tab 1: EDIT PROFILE */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <input type="hidden" name="current_org_logo" value={profile.org_logo || ""} />

            {profileError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 text-accent-600 dark:text-accent-400 text-sm font-medium flex items-center gap-2">
                <span>{profileSuccess}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Logo Preview */}
              <div className="flex items-center gap-4">
                {profile.org_logo ? (
                  <img
                    src={profile.org_logo}
                    alt={profile.org_name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xl">
                    {profile.org_abbreviation || profile.org_name[0]}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Logo Instansi Saat Ini</h4>
                  <p className="text-xs text-slate-400">Pilih logo baru di area upload untuk menggantinya.</p>
                </div>
              </div>

              {/* Nama Instansi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nama Instansi / Nama Lengkap
                </label>
                <input
                  name="org_name"
                  type="text"
                  required
                  defaultValue={profile.org_name}
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              {/* Singkatan & Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Singkatan Instansi
                  </label>
                  <input
                    name="org_abbreviation"
                    type="text"
                    defaultValue={profile.org_abbreviation || ""}
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nomor Telepon
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone || ""}
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Alamat Instansi
                </label>
                <textarea
                  name="address"
                  rows={2}
                  defaultValue={profile.address || ""}
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Ganti Logo File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Logo Baru
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition">
                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                      <svg className="w-6 h-6 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-slate-500 dark:text-slate-400 px-4 text-center">
                        {logoName ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{logoName}</span>
                        ) : (
                          <span>Pilih berkas gambar logo (Maks 2MB)</span>
                        )}
                      </p>
                    </div>
                    <input
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

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: UBAH PASSWORD */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {passwordError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 text-accent-600 dark:text-accent-400 text-sm font-medium flex items-center gap-2">
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Memproses..." : "Perbarui Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
