import React, { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import type { SopBookItem } from '../types';

interface SopMedisSectionProps {
  sopBooks: SopBookItem[];
  onOpenBook: (book: SopBookItem) => void;
}

export function SopMedisSection({ sopBooks, onOpenBook }: SopMedisSectionProps) {
  const [sopFilterCategory, setSopFilterCategory] = useState<string>('ALL');
  const [sopSearchQuery, setSopSearchQuery] = useState<string>('');

  const sopOnlyBooks = useMemo(
    () => sopBooks.filter((b) => b.docType === 'sop'),
    [sopBooks]
  );

  const sopCategories = useMemo(() => {
    const cats = Array.from(new Set(sopOnlyBooks.map((b) => b.kategori)));
    return ['ALL', ...cats];
  }, [sopOnlyBooks]);

  const filteredSopBooks = useMemo(() => {
    const q = sopSearchQuery.trim().toLowerCase();
    return sopOnlyBooks.filter((b) => {
      const matchCat = sopFilterCategory === 'ALL' || b.kategori === sopFilterCategory;
      const matchQ =
        !q ||
        b.judul.toLowerCase().includes(q) ||
        b.kodeDokumen.toLowerCase().includes(q) ||
        b.kategori.toLowerCase().includes(q) ||
        b.ringkasan.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [sopOnlyBooks, sopFilterCategory, sopSearchQuery]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Buku Panduan & SOP Medis Rumah Sakit
            </h2>
            <p className="text-xs text-slate-500">
              Klik "Buka Buku" untuk membaca pedoman medis interaktif halaman demi halaman.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={sopSearchQuery}
              onChange={(e) => setSopSearchQuery(e.target.value)}
              placeholder="Cari kode atau judul SOP..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs focus:border-[#8B1515] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {sopCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSopFilterCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                sopFilterCategory === cat
                  ? 'bg-[#8B1515] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSopBooks.map((book) => (
          <div
            key={book.id}
            className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-[#FFFDF9] p-5 shadow-2xs transition hover:border-red-300"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-rose-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#8B1515]">
                  {book.kodeDokumen}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {book.halaman.length} Hal
                </span>
              </div>
              <h3 className="mt-2.5 font-heading text-base font-extrabold text-slate-900">
                {book.judul}
              </h3>
              <p className="mt-1 text-[11px] font-semibold text-rose-700">{book.kategori}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                {book.ringkasan}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-amber-200/60 pt-3">
              <span className="font-mono text-[11px] font-bold text-slate-700">
                {book.tarifKbrp || 'SOP Internal'}
              </span>
              <button
                type="button"
                onClick={() => onOpenBook(book)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#6E0F0F]"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Buka Buku
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}