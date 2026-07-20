import React from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperadminCreateEventForm from "@/components/SuperadminCreateEventForm";

export const revalidate = 0;

export default async function SuperadminCreateEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();

  const { data: categories = [] } = await supabaseAdmin
    .from("event_categories")
    .select("id, name")
    .order("name", { ascending: true });
  const { data: rawPublishers = [] } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      profiles(org_name)
    `)
    .eq("role", "publisher")
    .eq("status", "approve");

  const publishers = (rawPublishers || []).map((p: any) => ({
    id: p.id,
    org_name: p.profiles?.org_name || "Penerbit Tanpa Nama",
  }));

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Buat Event Baru (Superadmin)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Terbitkan kegiatan kampus baru secara langsung atas nama publisher terdaftar. Event ini otomatis berstatus disetujui dan langsung tayang.
        </p>
      </div>

      {/* Form Pembuatan */}
      <SuperadminCreateEventForm categories={categories || []} publishers={publishers} />
    </div>
  );
}
