"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CategoryOption {
  id: string;
  name: string;
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  poster_image: string | null;
}

interface EditEventFormProps {
  categories: CategoryOption[];
  event: EventData;
}

export default function EditEventForm({ categories, event }: EditEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [posterName, setPosterName] = useState<string>("");
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const toDatetimeLocal = (isoString: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const date = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${date}T${hours}:${minutes}`;
  };

  const [startDateVal, setStartDateVal] = useState(toDatetimeLocal(event.start_date));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran poster kegiatan maksimal adalah 5MB.");
        e.target.value = "";
        setPosterName("");
        setPosterPreview(null);
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        setError("Format berkas harus berupa gambar.");
        e.target.value = "";
        setPosterName("");
        setPosterPreview(null);
        return;
      }
      
      setError(null);
      setPosterName(file.name);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelNewPoster = () => {
    setPosterName("");
    setPosterPreview(null);
    const fileInput = document.getElementById("poster_image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      setError("Tanggal selesai kegiatan harus setelah tanggal mulai kegiatan.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/publisher/events/${event.id}`, {
          method: "PUT",
          body: formData,
        });
        const res = await response.json();
        if (res.success) {
          setSuccess(res.message);
          setTimeout(() => {
            router.push("/publisher/events");
            router.refresh();
          }, 1500);
        } else {
          setError(res.message || "Gagal memperbarui event.");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan sistem saat memperbarui event.");
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md p-6 sm:p-10 transition">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-accent-50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 text-accent-600 dark:text-accent-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
        {/* Menyimpan URL poster saat ini jika tidak diganti */}
        <input type="hidden" name="current_poster_image" value={event.poster_image || ""} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Judul Event */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Judul Kegiatan
            </label>
            <input
              name="title"
              type="text"
              required
              defaultValue={event.title}
              placeholder="misal: Seminar Nasional Blockchain & AI"
              className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Kategori Kegiatan
            </label>
            <select
              name="category_id"
              required
              defaultValue={event.category_id}
              className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Lokasi / Tempat Pelaksanaan
            </label>
            <input
              name="location"
              type="text"
              required
              defaultValue={event.location || ""}
              placeholder="misal: Aula Utama / Zoom Meeting"
              className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tanggal & Waktu Mulai
            </label>
            <input
              required
              name="start_date"
              type="datetime-local"
              value={startDateVal}
              onChange={(e) => setStartDateVal(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {/* Tanggal Selesai */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tanggal & Waktu Selesai
            </label>
            <input
              name="end_date"
              type="datetime-local"
              required
              min={startDateVal}
              defaultValue={toDatetimeLocal(event.end_date)}
              className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {/* Deskripsi */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Deskripsi Kegiatan
            </label>
            <textarea
              name="description"
              rows={5}
              required
              defaultValue={event.description || ""}
              placeholder="Tuliskan deskripsi lengkap kegiatan..."
              className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Poster Upload dengan Pratinjau Baru & Tombol Batal */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Poster Saat Ini / Pratinjau Baru */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {posterPreview ? "Pratinjau Poster Baru" : "Poster Kegiatan"}
                </label>
                {posterPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2 flex flex-col items-center">
                    <img
                      src={posterPreview}
                      alt="Pratinjau Poster Baru"
                      className="w-full object-contain max-h-48 rounded-lg"
                    />
                    <div className="mt-3 flex items-center justify-between w-full px-2">
                      <span className="text-xs text-slate-500 truncate max-w-[120px]" title={posterName}>
                        {posterName}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelNewPoster}
                        className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-transparent rounded-lg transition cursor-pointer"
                      >
                        Batal Unggah
                      </button>
                    </div>
                  </div>
                ) : event.poster_image ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 p-2 max-w-xs">
                    <img
                      src={event.poster_image}
                      alt="Poster Saat Ini"
                      className="w-full object-contain max-h-48 rounded-lg"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 text-center">Poster saat ini</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 flex items-center justify-center text-slate-400 text-xs h-48">
                    Belum ada poster terunggah
                  </div>
                )}
              </div>

              {/* Unggah Poster Baru */}
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ganti Berkas Poster
                </label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-4 text-center">
                      <span>Klik untuk memilih berkas poster baru (Maks 5MB)</span>
                    </p>
                  </div>
                  <input
                    id="poster_image"
                    name="poster_image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* Buttons Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
          <Link
            href="/publisher/events"
            className="px-5 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </span>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
