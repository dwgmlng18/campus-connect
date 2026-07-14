import React from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperadminLayoutWrapper from "./SuperadminLayoutWrapper";

export const revalidate = 0; // Data user selalu sinkron secara real-time

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Verifikasi login
  if (!user) {
    redirect("/login");
  }

  // 2. Verifikasi hak akses role superadmin via admin client (bypassing RLS)
  const supabaseAdmin = await createAdminClient();
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!dbUser || dbUser.role !== "superadmin") {
    redirect("/"); // Alihkan ke halaman beranda publik jika bukan superadmin
  }

  return (
    <SuperadminLayoutWrapper>
      {children}
    </SuperadminLayoutWrapper>
  );
}
