import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import EditPublisherForm from "./EditPublisherForm";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminEditPublisherPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabaseAdmin = await createAdminClient();

  // 1. Ambil data status pengguna dari tabel public.users menggunakan admin client
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, status, reject_reason")
    .eq("id", id)
    .single();

  if (userError || !userData) {
    notFound();
  }

  // 2. Ambil data profil instansi dari tabel public.profiles
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("org_name, org_logo, org_abbreviation, phone, address")
    .eq("user_id", id)
    .single();

  const publisher = {
    id: userData.id,
    status: userData.status,
    reject_reason: userData.reject_reason,
    org_name: profileData?.org_name || "Instansi Tanpa Nama",
    org_logo: profileData?.org_logo || null,
    org_abbreviation: profileData?.org_abbreviation || null,
    phone: profileData?.phone || null,
    address: profileData?.address || null,
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Edit Akun Publisher (Superadmin)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Ubah informasi profil instansi atau sesuaikan status persetujuan akun publisher secara manual.
        </p>
      </div>

      <EditPublisherForm publisher={publisher} />
    </div>
  );
}
