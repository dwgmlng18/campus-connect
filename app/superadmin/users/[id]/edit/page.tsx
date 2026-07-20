import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import EditUserForm from "@/components/EditUserForm";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminEditUserPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabaseAdmin = await createAdminClient();

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, role, status, reject_reason")
    .eq("id", id)
    .single();

  if (userError || !userData) {
    notFound();
  }
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("org_name, org_logo, org_abbreviation, phone, address")
    .eq("user_id", id)
    .single();

  let email = "Tidak diketahui";
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    if (authUser?.user) {
      email = authUser.user.email || "Tidak diketahui";
    }
  } catch (err) {
    console.error("Gagal mengambil data email dari auth:", err);
  }

  const userObject = {
    id: userData.id,
    role: userData.role,
    status: userData.status,
    reject_reason: userData.reject_reason,
    email,
    org_name: profileData?.org_name || (userData.role === "superadmin" ? "Administrator" : "Instansi Tanpa Nama"),
    org_logo: profileData?.org_logo || null,
    org_abbreviation: profileData?.org_abbreviation || null,
    phone: profileData?.phone || null,
    address: profileData?.address || null,
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Edit Akun Pengguna (Superadmin)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Ubah informasi profil pengguna, sesuaikan role, atau kelola status moderasi persetujuan akun secara manual.
        </p>
      </div>

      <EditUserForm user={userObject} />
    </div>
  );
}
