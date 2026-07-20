import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import EditEventForm from "@/components/EditEventForm";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabaseAdmin = await createAdminClient();
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, title, description, category_id, location, start_date, end_date, poster_image, created_by")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  if (event.created_by !== user.id) {
    redirect("/publisher/events");
  }
  const { data: categories = [] } = await supabase
    .from("event_categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Edit Event
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Ubah informasi kegiatan kampus Anda. Setelah diedit, status persetujuan yang ada saat ini tetap berlaku.
        </p>
      </div>

      {/* Form Edit */}
      <EditEventForm categories={categories || []} event={event} />
    </div>
  );
}
