import React, { useMemo, useState } from 'react';
import { Activity, Search, Trash2, X } from 'lucide-react';

export interface PsychologyResultItem {
  id: string;
  participantName: string;
  metaInfo?: string;
  testedAt: string;
  purpose: string;
  scoreSummary: string;
  interpretation: string;
  status: 'Completed' | 'Review';
}

interface HasilTesPsikologiSectionProps {
  records?: PsychologyResultItem[];
  onNotify?: (msg: string) => void;
}

export function HasilTesPsikologiSection({
  records = [],
  onNotify,
}: HasilTesPsikologiSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [selectedResult, setSelectedResult] = useState<PsychologyResultItem | null>(null);

  const filtered = useMemo(() => {
    return records
      .filter((r) => !deletedIds[r.id])
      .filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          !q ||
          r.participantName.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q) ||
          r.interpretation.toLowerCase().includes(q)
        );
      });
  }, [records, deletedIds, searchQuery]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Data Hasil &amp; Penilaian Tes &amp; Evaluasi Psikologi
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Hasil tes &amp; interpretasi psikologis yang masuk dari layanan publik warga.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama / tujuan / hasil..."
            className="h-9 w-full rounded-xl border border-slate-200 pr-3 pl-8 text-xs focus:border-[#8B1515] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="px-3.5 py-3 text-left">NAMA PESERTA</th>
              <th className="px-3.5 py-3 text-left">TANGGAL</th>
              <th className="px-3.5 py-3 text-left">TUJUAN EVALUASI</th>
              <th className="px-3.5 py-3 text-left">SKOR &amp; PENILAIAN</th>
              <th className="px-3.5 py-3 text-left">INTERPRETASI PSIKOLOGIS</th>
              <th className="px-3.5 py-3 text-center">STATUS</th>
              <th className="px-3.5 py-3 text-center">DETAIL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Belum ada hasil tes psikologi yang masuk dari warga.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                  <td className="px-3.5 py-3.5 text-left">
                    <p className="font-bold text-slate-900">{item.participantName}</p>
                    {item.metaInfo && (
                      <p className="text-[10px] text-slate-400">{item.metaInfo}</p>
                    )}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] text-slate-600">
                    {item.testedAt}
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-700">{item.purpose}</td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] font-semibold text-slate-800">
                    {item.scoreSummary}
                  </td>
                  <td className="px-3.5 py-3.5 text-left">
                    <span className="inline-flex rounded-lg border border-amber-200/80 bg-amber-50/70 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                      {item.interpretation}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedResult(item)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Hasil &amp; Penilaian
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletedIds((prev) => ({ ...prev, [item.id]: true }));
                          onNotify?.('Hasil tes psikologi dihapus dari daftar.');
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

      {selectedResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedResult(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  Evaluasi Psikologi · {selectedResult.participantName}
                </h3>
                <p className="font-mono text-[11px] text-slate-400">
                  {selectedResult.testedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              <p>
                <span className="font-semibold text-slate-500">Tujuan:</span>{' '}
                <span className="font-bold text-slate-900">{selectedResult.purpose}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Skor:</span>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {selectedResult.scoreSummary}
                </span>
              </p>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-slate-700">
                {selectedResult.interpretation}
              </div>
            </div>
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
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