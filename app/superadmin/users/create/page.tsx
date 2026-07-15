import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateUserForm from "@/components/CreateUserForm";

export default async function SuperadminCreateUserPage() {
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
          Tambah Akun Pengguna Baru
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Daftarkan akun Superadmin atau Publisher baru secara manual. Akun yang dibuat akan langsung dikonfirmasi, aktif, dan dapat langsung login.
        </p>
      </div>

      {/* Form Pembuatan */}
      <CreateUserForm />
    </div>
  );
}
