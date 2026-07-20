import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublisherLayoutWrapper from "@/components/PublisherLayoutWrapper";

export const revalidate = 0;

export default async function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_name, org_logo, org_abbreviation")
    .eq("user_id", user.id)
    .single();

  return (
    <PublisherLayoutWrapper profile={profile}>
      {children}
    </PublisherLayoutWrapper>
  );
}
