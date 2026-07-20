import React from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import CategoriesList from "@/components/CategoriesList";

export const revalidate = 0;

export default async function SuperadminCategoriesPage() {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Kelola Kategori Kegiatan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Kelola opsi kategori untuk klasifikasi kegiatan kampus di platform.
        </p>
      </div>

      {/* Categories Content List */}
      <CategoriesList initialCategories={categories || []} />
    </div>
  );
}
