import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { SopBookItem } from '../types';

interface SopBookModalProps {
  book: SopBookItem | null;
  pageIndex: number;
  onChangePage: (nextIdx: number) => void;
  onClose: () => void;
}

export function SopBookModal({ book, pageIndex, onChangePage, onClose }: SopBookModalProps) {
  if (!book) return null;

  const totalPages = Math.max(1, book.halaman.length);
  const safeIndex = Math.min(Math.max(0, pageIndex), totalPages - 1);
  const currentContent = book.halaman[safeIndex] ?? book.ringkasan;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-200/80 bg-[#FFFDF9] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-amber-200/70 bg-gradient-to-r from-[#8B1515] to-[#5E0C0C] px-6 py-4 text-white">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
                {book.kodeDokumen}
              </span>
              <span className="rounded-md bg-black/25 px-2.5 py-0.5 text-[10px] font-bold text-red-100">
                {book.kategori}
              </span>
            </div>
            <h3 className="mt-1.5 font-heading text-lg font-extrabold leading-snug text-white">
              {book.judul}
            </h3>
            <p className="mt-0.5 text-[11px] text-red-100/85">
              Oleh: <strong>{book.penulisPetinggi}</strong> · {book.tanggalUpdate}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-1.5 text-white transition hover:bg-white/20"
            aria-label="Tutup buku"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-h-[260px] bg-[radial-gradient(#e5dccb_0.75px,transparent_0.75px)] [background-size:16px_16px] p-6 sm:p-8">
          <div className="rounded-2xl border border-amber-200/90 bg-white/95 p-6 shadow-xs">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-[11px]">
              <span className="font-bold uppercase tracking-wider text-[#8B1515]">
                Halaman {safeIndex + 1} dari {totalPages}
              </span>
              {book.tarifKbrp && (
                <span className="rounded-md bg-red-50 px-2.5 py-0.5 font-mono font-bold text-[#8B1515]">
                  {book.tarifKbrp}
                </span>
              )}
            </div>

            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {currentContent}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-amber-200/80 bg-[#FAF5EB] px-6 py-3.5">
          <button
            type="button"
            onClick={() => onChangePage(safeIndex - 1)}
            disabled={safeIndex <= 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Halaman Sebelumnya
          </button>

          <div className="flex items-center gap-1.5">
            {book.halaman.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangePage(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === safeIndex ? 'w-6 bg-[#8B1515]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Ke halaman ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => onChangePage(safeIndex + 1)}
            disabled={safeIndex >= totalPages - 1}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#6E0F0F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Halaman Berikutnya
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}