import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperadminEditEventForm from "@/components/SuperadminEditEventForm";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminEditEventPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabaseAdmin = await createAdminClient();

  // 1. Ambil data event menggunakan admin client (bypass RLS)
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, title, description, category_id, location, start_date, end_date, poster_image, created_by")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Ambil data kategori event
  const { data: categories = [] } = await supabaseAdmin
    .from("event_categories")
    .select("id, name")
    .order("name", { ascending: true });

  // 3. Ambil daftar publisher yang sudah disetujui (status = approve)
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Edit Event (Superadmin)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Ubah informasi kegiatan kampus. Perubahan yang disimpan oleh Superadmin akan langsung diperbarui.
        </p>
      </div>

      <SuperadminEditEventForm categories={categories || []} publishers={publishers} event={event} />
    </div>
  );
}
