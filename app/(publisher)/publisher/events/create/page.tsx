import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateEventForm from "./CreateEventForm";

export const revalidate = 0;

export default async function CreateEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil data seluruh kategori event untuk pilihan select
  const { data: categories = [] } = await supabase
    .from("event_categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Tambah Event Baru
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Buat pengajuan kegiatan kampus baru. Informasi penyelenggara akan disematkan secara otomatis dari profil instansi Anda.
        </p>
      </div>

      {/* Form Pembuatan */}
      <CreateEventForm categories={categories || []} />
    </div>
  );
}
