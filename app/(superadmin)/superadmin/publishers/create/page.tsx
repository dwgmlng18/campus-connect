import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreatePublisherForm from "./CreatePublisherForm";

export default async function SuperadminCreatePublisherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Tambah Akun Publisher (Superadmin)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Daftarkan organisasi/instansi mahasiswa baru secara manual. Akun akan langsung terkonfirmasi, disetujui, dan aktif menerbitkan event.
        </p>
      </div>

      {/* Form Pembuatan */}
      <CreatePublisherForm />
    </div>
  );
}
