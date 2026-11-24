import React, { useMemo, useState } from 'react';
import { CalendarClock, Search, Trash2 } from 'lucide-react';

export interface AppointmentRecordItem {
  id: string;
  patientName: string;
  patientPhoneOrCode?: string;
  doctorName: string;
  specialty: string;
  scheduleAt: string;
  complaint: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}

interface DataJanjiTemuSectionProps {
  appointments?: AppointmentRecordItem[];
  onNotify?: (msg: string) => void;
}

export function DataJanjiTemuSection({
  appointments = [],
  onNotify,
}: DataJanjiTemuSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, AppointmentRecordItem['status']>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => !deletedIds[a.id])
      .map((a) => ({
        ...a,
        status: statusOverrides[a.id] ?? a.status,
      }))
      .filter((a) => {
        const q = searchQuery.trim().toLowerCase();
        const matchQuery =
          !q ||
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.complaint.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
        return matchQuery && matchStatus;
      });
  }, [appointments, deletedIds, statusOverrides, searchQuery, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Data Janji Temu Pasien
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Kelola status janji temu pasien yang masuk dari layanan publik.
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
              placeholder="Cari pasien / dokter..."
              className="h-9 rounded-xl border border-slate-200 pr-3 pl-8 text-xs focus:border-[#8B1515] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#8B1515] focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="px-3.5 py-3 text-left">PASIEN</th>
              <th className="px-3.5 py-3 text-left">DOKTER TUJUAN</th>
              <th className="px-3.5 py-3 text-left">SPESIALISASI</th>
              <th className="px-3.5 py-3 text-left">TANGGAL &amp; JAM</th>
              <th className="px-3.5 py-3 text-left">KELUHAN</th>
              <th className="px-3.5 py-3 text-center">STATUS</th>
              <th className="px-3.5 py-3 text-center">UBAH STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Belum ada data janji temu pasien yang masuk dari warga.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                  <td className="px-3.5 py-3.5 text-left">
                    <p className="font-bold text-slate-900">{item.patientName}</p>
                    {item.patientPhoneOrCode && (
                      <p className="font-mono text-[10px] text-slate-400">
                        {item.patientPhoneOrCode}
                      </p>
                    )}
                  </td>
                  <td className="px-3.5 py-3.5 text-left font-bold text-slate-800">
                    {item.doctorName}
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-600">{item.specialty}</td>
                  <td className="px-3.5 py-3.5 text-left font-mono text-[11px] text-slate-700">
                    {item.scheduleAt}
                  </td>
                  <td className="px-3.5 py-3.5 text-left text-slate-700">{item.complaint}</td>
                  <td className="px-3.5 py-3.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.status === 'Completed' || item.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const next = e.target.value as AppointmentRecordItem['status'];
                          setStatusOverrides((prev) => ({ ...prev, [item.id]: next }));
                          onNotify?.(`Status janji temu diubah ke ${next}.`);
                        }}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-800 focus:border-[#8B1515] focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletedIds((prev) => ({ ...prev, [item.id]: true }));
                          onNotify?.('Data janji temu dihapus dari daftar.');
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