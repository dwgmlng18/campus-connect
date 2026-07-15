import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import UsersList from "@/components/UsersList";

export const revalidate = 0;

export default async function SuperadminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();

  // 1. Ambil data semua user di tabel public.users
  const { data: rawUsers = [] } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      role,
      status,
      reject_reason,
      profiles(org_name, org_logo, org_abbreviation, phone, address)
    `)
    .order("created_at", { ascending: false });

  // 2. Ambil data email dari Supabase Auth
  let authUsers: any[] = [];
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    authUsers = data.users || [];
  } catch (err) {
    console.error("Gagal mengambil data email user dari auth:", err);
  }

  const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

  // Map data untuk komponen UsersList
  const formattedUsers = (rawUsers || []).map((u: any) => {
    const profile = Array.isArray(u.profiles) ? u.profiles[0] : (u.profiles as any);
    return {
      id: u.id,
      role: u.role,
      status: u.status,
      reject_reason: u.reject_reason,
      email: emailMap.get(u.id) || "Tidak diketahui",
      org_name: profile?.org_name || (u.role === "superadmin" ? "Administrator" : "Instansi Tanpa Nama"),
      org_logo: profile?.org_logo || null,
      org_abbreviation: profile?.org_abbreviation || null,
      phone: profile?.phone || null,
      address: profile?.address || null,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Kelola data and status persetujuan semua akun Superadmin dan Publisher pada platform.
          </p>
        </div>
        <Link
          href="/superadmin/users/create"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah User Baru
        </Link>
      </div>

      {/* Users Table/List with Search and Role filters */}
      <UsersList initialUsers={formattedUsers} />
    </div>
  );
}
