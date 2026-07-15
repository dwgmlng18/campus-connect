"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterBarProps {
  categories: { id: string; name: string }[];
}

export default function FilterBar({ categories }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  // Sinkronisasi state lokal jika query params berubah (misalnya pencarian dari beranda)
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setDate(searchParams.get("date") || "");
  }, [searchParams]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (date) params.set("date", date);

    router.push(`/events?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setDate("");
    router.push("/events");
  };

  return (
    <form
      onSubmit={handleFilter}
      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md flex flex-col md:flex-row gap-4 items-end w-full"
    >
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
          Kata Kunci
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama event..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        />
      </div>

      <div className="w-full md:w-48">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
          Kategori
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full md:w-48">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
          Waktu Kegiatan
        </label>
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        >
          <option value="">Kapan Saja</option>
          <option value="today">Hari Ini</option>
          <option value="week">1 Minggu Ke Depan</option>
          <option value="month">1 Bulan Ke Depan</option>
        </select>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <button
          type="submit"
          className="flex-grow md:flex-grow-0 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer whitespace-nowrap"
        >
          Terapkan
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
