"use client";

import React, { useState, useEffect } from "react";
import SuperadminSidebar from "./SuperadminSidebar";

interface SuperadminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function SuperadminLayoutWrapper({ children }: SuperadminLayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Muat preferensi dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem("superadmin_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("superadmin_sidebar_collapsed", String(collapsed));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Superadmin Sidebar */}
      <SuperadminSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={handleToggleCollapse} 
      />

      {/* Main Content Workspace */}
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
