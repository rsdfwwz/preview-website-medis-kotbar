import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Search, Skull, Trash2 } from 'lucide-react';

export interface DeathRecordItem {
  id: string;
  patientName: string;
  nik?: string;
  causeOrLocation: string;
  examiningDoctor: string;
  recordedAt: string;
  status: 'Tercatat' | 'Sertifikat Terbit' | 'Perlu Verifikasi';
}

interface DaftarKematianSectionProps {
  records?: DeathRecordItem[];
  onNotify?: (msg: string) => void;
}

function getBadgeClass(status: DeathRecordItem['status']): string {
  if (status === 'Sertifikat Terbit') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70';
  }
  if (status === 'Tercatat') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/70';
  }
  return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70';
}

export function DaftarKematianSection({
  records = [],
  onNotify,
}: DaftarKematianSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, DeathRecordItem['status']>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

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
          r.patientName.toLowerCase().includes(q) ||
          (r.nik && r.nik.toLowerCase().includes(q)) ||
          r.causeOrLocation.toLowerCase().includes(q) ||
          r.examiningDoctor.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
        return matchQuery && matchStatus;
      });
  }, [records, deletedIds, statusOverrides, searchQuery, statusFilter]);

  const handleIssue = (id: string) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: 'Sertifikat Terbit' }));
    onNotify?.('Sertifikat Kematian (CK) diterbitkan.');
  };

  const handleReset = (id: string) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: 'Tercatat' }));
    onNotify?.('Status CK dikembalikan ke Tercatat.');
  };

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => ({ ...prev, [id]: true }));
    onNotify?.('Data kematian dihapus dari daftar.');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <Skull className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-extrabold text-slate-900">
                Daftar Kematian (CK) &amp; Sertifikat Medis
              </h2>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#8B1515]">
                {filtered.length} Data
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Data pencatatan pasien &amp; penerbitan CK yang masuk dari layanan publik warga.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pasien, NIK, penyebab/lokasi, atau dokter..."
            className="h-9 w-full rounded-xl border border-slate-200 pr-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#8B1515] focus:outline-none"
        >
          <option value="ALL">Semua Status</option>
          <option value="Perlu Verifikasi">Perlu Verifikasi</option>
          <option value="Tercatat">Tercatat</option>
          <option value="Sertifikat Terbit">Sertifikat Terbit</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="px-3.5 py-3 text-left">NAMA PASIEN &amp; NIK</th>
              <th className="px-3.5 py-3 text-left">PENYEBAB / LOKASI</th>
              <th className="px-3.5 py-3 text-left">DOKTER PEMERIKSA</th>
              <th className="px-3.5 py-3 text-center">STATUS</th>
              <th className="px-3.5 py-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                  Belum ada data kematian (CK) yang masuk dari warga.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                  <td className="px-3.5 py-3.5 text-left">
                    <p className="font-bold text-slate-900">{item.patientName}</p>
                    <p className="font-mono text-[10px] text-slate-400">
                      NIK: {item.nik || '-'} · {item.recordedAt}
                    </p>
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-700">
                    {item.causeOrLocation}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-medium text-slate-800">
                    {item.examiningDoctor}
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      {item.status !== 'Sertifikat Terbit' ? (
                        <button
                          type="button"
                          onClick={() => handleIssue(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Terbitkan CK</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReset(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center rounded-lg border border-rose-200 bg-white p-1.5 text-[#8B1515] transition hover:bg-rose-50"
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