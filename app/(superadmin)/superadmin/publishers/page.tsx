import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PublishersList from "./PublishersList";

export const revalidate = 0;

export default async function SuperadminPublishersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();

  // Ambil semua user dengan role publisher beserta data profilnya
  const { data: rawPublishers = [] } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      status,
      reject_reason,
      profiles(org_name, org_logo, org_abbreviation, phone, address)
    `)
    .eq("role", "publisher")
    .order("created_at", { ascending: false });

  // Map data agar mudah dibaca oleh komponen PublishersList
  const formattedPublishers = (rawPublishers || []).map((pub: any) => {
    const profile = pub.profiles;
    return {
      id: pub.id,
      status: pub.status,
      reject_reason: pub.reject_reason,
      org_name: profile?.org_name || "Instansi Tanpa Nama",
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
            Manajemen Akun Publisher
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Tinjau, setujui, edit, atau buat pendaftaran organisasi mahasiswa penyelenggara kegiatan kampus.
          </p>
        </div>
        <Link
          href="/superadmin/publishers/create"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Tambah Publisher Baru
        </Link>
      </div>

      {/* Publishers Table/List */}
      <PublishersList initialPublishers={formattedPublishers} />
    </div>
  );
}
