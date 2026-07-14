import React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminUserDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabaseAdmin = await createAdminClient();

  // 1. Ambil data status pengguna dari tabel public.users
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, role, status, reject_reason")
    .eq("id", id)
    .single();

  if (userError || !userData) {
    notFound();
  }

  // 2. Ambil data profil dari tabel public.profiles
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("org_name, org_logo, org_abbreviation, phone, address")
    .eq("user_id", id)
    .single();

  // 3. Ambil data email dari Supabase Auth
  let email = "Tidak diketahui";
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    if (authUser?.user) {
      email = authUser.user.email || "Tidak diketahui";
    }
  } catch (err) {
    console.error("Gagal mengambil data email dari auth:", err);
  }

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    approve: "bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-400 border-accent-200 dark:border-accent-800",
    reject: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending / Menunggu",
    approve: "Disetujui / Aktif",
    reject: "Ditolak / Nonaktif",
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Navigation & Header */}
      <div className="flex justify-between items-center mb-8">
        <Link
          href="/superadmin/users"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Manajemen Users
        </Link>
        <Link
          href={`/superadmin/users/${id}/edit`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit User
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl p-8 sm:p-10 transition">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 dark:border-slate-850 pb-8 mb-8 text-center sm:text-left">
          {userData.role === "publisher" && profileData?.org_logo ? (
            <img
              src={profileData.org_logo}
              alt={profileData.org_name}
              className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 flex-shrink-0"
            />
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl border-2 flex-shrink-0 ${
              userData.role === "superadmin"
                ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                : "bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800"
            }`}>
              {userData.role === "superadmin" ? "A" : (profileData?.org_abbreviation || profileData?.org_name?.[0] || "P")}
            </div>
          )}

          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {profileData?.org_name || (userData.role === "superadmin" ? "Administrator" : "Instansi Tanpa Nama")}
                </h2>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  userData.role === "superadmin"
                    ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-105"
                    : "bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 border-primary-105"
                }`}>
                  {userData.role === "superadmin" ? "Admin" : "Publisher"}
                </span>
              </div>
              <p className="text-slate-400 mt-1 truncate">{email}</p>
            </div>

            <div className="flex justify-center sm:justify-start">
              <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold border ${statusStyles[userData.status]}`}>
                {statusLabels[userData.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Details Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2">
            Detail Informasi Akun
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-slate-400 block mb-1">Role Akun</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {userData.role === "superadmin" ? "Superadmin (Akses Penuh Moderasi)" : "Publisher (Penyelenggara Kegiatan)"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Email Terdaftar</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
            </div>

            {userData.role === "publisher" && (
              <>
                <div>
                  <span className="text-slate-400 block mb-1">Singkatan / Akronim</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profileData?.org_abbreviation || "-"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Nomor Telepon / WhatsApp</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profileData?.phone || "-"}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-1">Alamat Sekretariat</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profileData?.address || "-"}
                  </span>
                </div>
              </>
            )}

            {userData.status === "reject" && userData.reject_reason && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
                <span className="font-bold block mb-1 text-xs uppercase tracking-wider">Alasan Penolakan Akun:</span>
                <p className="text-sm italic font-medium">"{userData.reject_reason}"</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
