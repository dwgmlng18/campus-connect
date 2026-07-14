import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Ambil sesi user untuk menentukan tombol login/dashboard di Navbar
  const { data: { user } } = await supabase.auth.getUser();
  
  let publicUser = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    publicUser = data;
  }

  const dashboardUrl = publicUser?.role === "superadmin" 
    ? "/superadmin/dashboard" 
    : "/publisher/dashboard";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400 hover:opacity-90 transition">
                Campus Connect
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
                Beranda
              </Link>
              <Link href="/events" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
                Daftar Event
              </Link>
            </nav>

            {/* Auth Action Buttons */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href={dashboardUrl}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-sm"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-sm"
                  >
                    Daftar Publisher
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Campus Connect. Hak Cipta Dilindungi.
          </p>
          <div className="mt-4 md:mt-0 flex justify-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-primary-500 transition">Beranda</Link>
            <Link href="/events" className="hover:text-primary-500 transition">Daftar Event</Link>
            <Link href="/login" className="hover:text-primary-500 transition">Masuk Publisher</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
