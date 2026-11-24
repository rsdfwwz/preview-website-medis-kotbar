import React, { useMemo, useState } from 'react';
import { Eye, Search, Trash2, X } from 'lucide-react';

export interface ColorBlindResultItem {
  id: string;
  participantName: string;
  testedAt: string;
  scorePercent: number;
  correctCount: number;
  wrongCount: number;
  category: string;
}

interface HasilTesButaWarnaSectionProps {
  records?: ColorBlindResultItem[];
  onNotify?: (msg: string) => void;
}

export function HasilTesButaWarnaSection({
  records = [],
  onNotify,
}: HasilTesButaWarnaSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<ColorBlindResultItem | null>(null);

  const filtered = useMemo(() => {
    return records
      .filter((r) => !deletedIds[r.id])
      .filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          !q ||
          r.participantName.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      });
  }, [records, deletedIds, searchQuery]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Hasil Tes Buta Warna (20 Lempeng Ishihara)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Rekap skor &amp; kategori tes buta warna yang masuk dari halaman publik warga.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama / kategori..."
            className="h-9 w-full rounded-xl border border-slate-200 pr-3 pl-8 text-xs focus:border-[#8B1515] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="px-3.5 py-3 text-left">NAMA PESERTA</th>
              <th className="px-3.5 py-3 text-left">TANGGAL TES</th>
              <th className="px-3.5 py-3 text-center">HASIL SKOR</th>
              <th className="px-3.5 py-3 text-center">JAWABAN BENAR</th>
              <th className="px-3.5 py-3 text-center">JAWABAN SALAH</th>
              <th className="px-3.5 py-3 text-center">KATEGORI</th>
              <th className="px-3.5 py-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Belum ada hasil tes buta warna yang masuk dari warga.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                  <td className="px-3.5 py-3.5 text-left font-bold text-slate-900">
                    {item.participantName}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] text-slate-600">
                    {item.testedAt}
                  </td>
                  <td className="px-3.5 py-3.5 text-center font-mono font-extrabold text-slate-900">
                    {item.scorePercent}%
                  </td>
                  <td className="px-3.5 py-3.5 text-center font-mono font-bold text-emerald-600">
                    {item.correctCount}
                  </td>
                  <td className="px-3.5 py-3.5 text-center font-mono font-bold text-rose-600">
                    {item.wrongCount}
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.category.toLowerCase() === 'normal'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Detail Jawaban
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletedIds((prev) => ({ ...prev, [item.id]: true }));
                          onNotify?.('Hasil tes buta warna dihapus dari daftar.');
                        }}
                        className="inline-flex items-center rounded-lg border border-rose-200 bg-white p-1.5 text-[#8B1515] hover:bg-rose-50"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  Detail Ishihara · {selectedItem.participantName}
                </h3>
                <p className="font-mono text-[11px] text-slate-400">{selectedItem.testedAt}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <p>
                <span className="font-semibold text-slate-500">Skor:</span>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {selectedItem.scorePercent}%
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Benar / Salah:</span>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {selectedItem.correctCount} / {selectedItem.wrongCount}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Kategori:</span>{' '}
                <span className="font-bold text-slate-900">{selectedItem.category}</span>
              </p>
            </div>
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}