import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2, Search, Trash2, X } from 'lucide-react';

export interface SksRecordItem {
  id: string;
  fullName: string;
  submittedAt: string;
  gender: string;
  age: string;
  occupation: string;
  purpose: string;
  status: 'Pending' | 'Issued' | 'Ditolak';
}

interface HasilSksSectionProps {
  records?: SksRecordItem[];
  onNotify?: (msg: string) => void;
}

export function HasilSksSection({ records = [], onNotify }: HasilSksSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, SksRecordItem['status']>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<SksRecordItem | null>(null);

  const filtered = useMemo(() => {
    return records
      .filter((r) => !deletedIds[r.id])
      .map((r) => ({
        ...r,
        status: statusOverrides[r.id] ?? r.status,
      }))
      .filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        const matchQuery =
          !q ||
          r.fullName.toLowerCase().includes(q) ||
          r.occupation.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q);
        const matchPurpose = purposeFilter === 'ALL' || r.purpose === purposeFilter;
        return matchQuery && matchPurpose;
      });
  }, [records, deletedIds, statusOverrides, searchQuery, purposeFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Data Surat Keterangan Sehat (SKS)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Verifikasi &amp; penerbitan SKS warga dari pengajuan layanan publik.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / pekerjaan..."
              className="h-9 rounded-xl border border-slate-200 pr-3 pl-8 text-xs focus:border-[#8B1515] focus:outline-none"
            />
          </div>
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#8B1515] focus:outline-none"
          >
            <option value="ALL">Semua Keperluan</option>
            <option value="Lampiran Pembuatan Lisensi">Lampiran Pembuatan Lisensi</option>
            <option value="Lampiran Melamar Pekerjaan">Lampiran Melamar Pekerjaan</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="px-3.5 py-3 text-left">NAMA LENGKAP</th>
              <th className="px-3.5 py-3 text-left">TANGGAL</th>
              <th className="px-3.5 py-3 text-left">GENDER</th>
              <th className="px-3.5 py-3 text-left">UMUR</th>
              <th className="px-3.5 py-3 text-left">PEKERJAAN</th>
              <th className="px-3.5 py-3 text-left">KEPERLUAN</th>
              <th className="px-3.5 py-3 text-center">STATUS</th>
              <th className="px-3.5 py-3 text-center">DETAIL / ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                  Belum ada data Surat Keterangan Sehat (SKS) yang masuk dari warga.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                  <td className="px-3.5 py-3.5 text-left font-bold text-slate-900">
                    {item.fullName}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] text-slate-600">
                    {item.submittedAt}
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-700">{item.gender}</td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] text-slate-700">
                    {item.age}
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-700">{item.occupation}</td>
                  <td className="px-3.5 py-3.5 text-left text-slate-800">{item.purpose}</td>
                  <td className="px-3.5 py-3.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.status === 'Issued'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'Ditolak'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      {item.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusOverrides((prev) => ({ ...prev, [item.id]: 'Issued' }));
                            onNotify?.('SKS diterbitkan.');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Issue</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] hover:bg-rose-100"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletedIds((prev) => ({ ...prev, [item.id]: true }));
                          onNotify?.('Data SKS dihapus dari daftar.');
                        }}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-700"
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
                  Detail SKS · {selectedItem.fullName}
                </h3>
                <p className="font-mono text-[11px] text-slate-400">
                  {selectedItem.submittedAt}
                </p>
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
                <span className="font-semibold text-slate-500">Gender / Umur:</span>{' '}
                <span className="font-bold text-slate-900">
                  {selectedItem.gender} · {selectedItem.age}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Pekerjaan:</span>{' '}
                <span className="font-bold text-slate-900">{selectedItem.occupation}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Keperluan:</span>{' '}
                <span className="font-bold text-slate-900">{selectedItem.purpose}</span>
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