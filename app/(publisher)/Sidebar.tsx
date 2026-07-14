"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from "@/app/login/actions";

interface SidebarProps {
  profile: {
    org_name: string;
    org_logo: string | null;
    org_abbreviation: string | null;
  } | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ profile, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/publisher/dashboard",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "Event Saya",
      href: "/publisher/events",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: "Profil Instansi",
      href: "/publisher/profile",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      const res = await logoutUser();
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      }
    }
  };

  return (
    <>
      {/* Mobile Toggle Navbar Header */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 h-16 sticky top-0 z-40 transition duration-200">
        <Link href="/publisher/dashboard" className="text-lg font-bold text-primary-600 dark:text-primary-400">
          Campus Connect
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-16 md:top-0 bottom-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex-1 py-6 px-4 overflow-y-auto">
          
          {/* Logo (Desktop Only) & Collapse Toggle Button */}
          <div className={`hidden md:flex items-center justify-between gap-2 mb-8 px-2 ${isCollapsed ? "flex-col items-center" : "flex-row"}`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link href="/" className="text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400 truncate">
                    Campus Connect
                  </Link>
                  <span className="text-[9px] font-bold text-slate-400 border border-slate-200 dark:border-slate-800 px-1 py-0.5 rounded uppercase flex-shrink-0">
                    Pub
                  </span>
                </div>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-805 focus:outline-none transition cursor-pointer flex-shrink-0"
                  title="Sembunyikan Sidebar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
                  CC
                </Link>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-1.5 mt-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-805 focus:outline-none transition cursor-pointer"
                  title="Tampilkan Sidebar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Profil Organisasi Singkat */}
          <div className={`mb-8 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center ${isCollapsed ? "justify-center p-2" : "gap-3"}`} title={isCollapsed ? (profile?.org_name || "Instansi") : undefined}>
            {profile?.org_logo ? (
              <img
                src={profile.org_logo}
                alt={profile.org_name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {profile?.org_abbreviation || (profile?.org_name ? profile.org_name[0] : "P")}
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {profile?.org_name || "Instansi"}
                </h4>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {profile?.org_abbreviation || "Publisher"}
                </p>
              </div>
            )}
          </div>

          {/* Menu Link */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center rounded-xl transition-all duration-150 ${
                    isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5 text-sm"
                  } font-semibold ${
                    isActive
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950/20"
                  }`}
                >
                  {item.icon}
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex-shrink-0">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Keluar Akun" : undefined}
            className={`w-full flex items-center rounded-xl transition-all duration-150 ${
              isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5 text-sm"
            } font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/10 cursor-pointer`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
