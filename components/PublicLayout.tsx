import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col">{children}</main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
