import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const revalidate = 0;

export default async function PublisherProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil data profil instansi
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_name, org_logo, org_abbreviation, phone, address")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/publisher/dashboard");
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Pengaturan Profil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Perbarui informasi organisasi/instansi Anda atau ubah password akun di sini.
        </p>
      </div>

      {/* Form Profil & Password */}
      <ProfileForm profile={profile} />
    </div>
  );
}
