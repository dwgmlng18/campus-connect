import React from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperadminLayoutWrapper from "@/components/SuperadminLayoutWrapper";

export const revalidate = 0; // Mengamankan status otorisasi admin secara real-time

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Jika belum login, alihkan ke login
  if (!user) {
    redirect("/login");
  }

  // Gunakan admin client untuk membypass RLS pada sistem layout server-side
  const supabaseAdmin = await createAdminClient();
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // Jika bukan superadmin, lempar ke halaman utama
  if (!dbUser || dbUser.role !== "superadmin") {
    redirect("/");
  }

  return (
    <SuperadminLayoutWrapper>
      {children}
    </SuperadminLayoutWrapper>
  );
}
