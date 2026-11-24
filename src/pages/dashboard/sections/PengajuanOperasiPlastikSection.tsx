import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Search, Sparkles, Trash2, XCircle } from 'lucide-react';

export interface PlasticSurgeryItem {
  id: string;
  patientName: string;
  submittedAt: string;
  procedureName: string;
  documentsSummary: string;
  assignedDoctor: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai';
}

interface PengajuanOperasiPlastikSectionProps {
  requests?: PlasticSurgeryItem[];
  onNotify?: (msg: string) => void;
}

export function PengajuanOperasiPlastikSection({
  requests = [],
  onNotify,
}: PengajuanOperasiPlastikSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, PlasticSurgeryItem['status']>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return requests
      .filter((r) => !deletedIds[r.id])
      .map((r) => ({
        ...r,
        status: statusOverrides[r.id] ?? r.status,
      }))
      .filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        const matchQuery =
          !q ||
          r.patientName.toLowerCase().includes(q) ||
          r.procedureName.toLowerCase().includes(q) ||
          r.assignedDoctor.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
        return matchQuery && matchStatus;
      });
  }, [requests, deletedIds, statusOverrides, searchQuery, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Data Pengajuan Prosedur Operasi Plastik
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Verifikasi dokumen SKB/SKWB &amp; persetujuan dokter untuk pengajuan warga.
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
              placeholder="Cari pasien / prosedur / dokter..."
              className="h-9 rounded-xl border border-slate-200 pr-3 pl-8 text-xs focus:border-[#8B1515] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#8B1515] focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="px-3.5 py-3 text-left">NAMA PASIEN</th>
              <th className="px-3.5 py-3 text-left">TANGGAL PENGAJUAN</th>
              <th className="px-3.5 py-3 text-left">PROSEDUR OPERASI PLASTIK</th>
              <th className="px-3.5 py-3 text-left">DOKUMEN PENDUKUNG</th>
              <th className="px-3.5 py-3 text-left">DOKTER YANG MENANGANI</th>
              <th className="px-3.5 py-3 text-center">STATUS</th>
              <th className="px-3.5 py-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Tidak ada data pengajuan operasi plastik yang masuk dari warga.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                  <td className="px-3.5 py-3.5 text-left font-bold text-slate-900">
                    {item.patientName}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] text-slate-600">
                    {item.submittedAt}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-semibold text-slate-800">
                    {item.procedureName}
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-600">
                    {item.documentsSummary || '-'}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-medium text-slate-800">
                    {item.assignedDoctor}
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.status === 'Disetujui' || item.status === 'Selesai'
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
                      {item.status === 'Menunggu' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusOverrides((prev) => ({
                                ...prev,
                                [item.id]: 'Disetujui',
                              }));
                              onNotify?.('Pengajuan operasi plastik disetujui.');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>ACC</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusOverrides((prev) => ({
                                ...prev,
                                [item.id]: 'Ditolak',
                              }));
                              onNotify?.('Pengajuan operasi plastik ditolak.');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] hover:bg-rose-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusOverrides((prev) => ({ ...prev, [item.id]: 'Menunggu' }));
                            onNotify?.('Status pengajuan dikembalikan ke Menunggu.');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDeletedIds((prev) => ({ ...prev, [item.id]: true }));
                          onNotify?.('Pengajuan dihapus dari daftar.');
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
    </section>
  );
}