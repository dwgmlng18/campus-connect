"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface CategoryItem {
  id: string;
  name: string;
}

interface CategoriesListProps {
  initialCategories: CategoryItem[];
}

export default function CategoriesList({ initialCategories }: CategoriesListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // State Modals / Inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim().length === 0) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/superadmin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName }),
        });
        const res = await response.json();
        if (res.success) {
          setShowAddModal(false);
          setCategoryName("");
          router.refresh();
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Gagal menambahkan kategori baru.");
      }
    });
  };

  const openEditModal = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setCategoryName(cat.name);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || categoryName.trim().length === 0) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/superadmin/categories/${selectedCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName }),
        });
        const res = await response.json();
        if (res.success) {
          setShowEditModal(false);
          setSelectedCategory(null);
          setCategoryName("");
          router.refresh();
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Gagal memperbarui kategori.");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/superadmin/categories/${id}`, {
            method: "DELETE",
          });
          const res = await response.json();
          if (res.success) {
            router.refresh();
          } else {
            alert(res.message);
          }
        } catch (err) {
          alert("Gagal menghapus kategori.");
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setCategoryName("");
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kategori Baru
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden max-w-xl">
        {initialCategories.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="py-4 px-6">Nama Kategori</th>
                <th className="py-4 px-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {initialCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition">
                  <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                    {cat.name}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-3 text-xs font-bold">
                      <button
                        onClick={() => openEditModal(cat)}
                        disabled={isPending}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition cursor-pointer disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-700 transition cursor-pointer disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Belum ada kategori event yang ditambahkan.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tambah Kategori</h3>
              <p className="text-xs text-slate-500 mt-1">Tambahkan klasifikasi kategori baru untuk event kampus.</p>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="misal: Teknologi, Olahraga, Musik..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Tambah Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Ubah Kategori</h3>
              <p className="text-xs text-slate-500 mt-1">Ubah nama klasifikasi kategori event.</p>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
