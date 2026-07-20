"use client";

import React, { useState, useEffect } from "react";
import PublisherSidebar from "./PublisherSidebar";

interface DashboardLayoutWrapperProps {
  profile: {
    org_name: string;
    org_logo: string | null;
    org_abbreviation: string | null;
  } | null;
  children: React.ReactNode;
}

export default function PublisherLayoutWrapper({ profile, children }: DashboardLayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("publisher_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("publisher_sidebar_collapsed", String(collapsed));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar Navigation */}
      <PublisherSidebar 
        profile={profile} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={handleToggleCollapse} 
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <main className="flex-grow p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
