import React from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperadminLayoutWrapper from "@/components/SuperadminLayoutWrapper";

export const revalidate = 0; 

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = await createAdminClient();
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!dbUser || dbUser.role !== "superadmin") {
    redirect("/");
  }

  return (
    <SuperadminLayoutWrapper>
      {children}
    </SuperadminLayoutWrapper>
  );
}
