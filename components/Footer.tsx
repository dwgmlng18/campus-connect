import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
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
  );
}
