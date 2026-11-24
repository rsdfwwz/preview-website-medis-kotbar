import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Filter, Shield, Stethoscope } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { formatStaffDisplayName, getDutyStatusBadge } from '@/utils/formatters';

export function DoctorsSchedulePage() {
  const { staffList } = usePortal();
  const [selectedDivisi, setSelectedDivisi] = useState<string>('Semua');

  const activeStaff = staffList.filter((s) => s.statusAkun === 'aktif');
  const divisions = ['Semua', 'IGD', 'Poli Umum', 'Bedah Plastik', 'Psikologi', 'Farmasi', 'Manajemen'];

  const filteredStaff =
    selectedDivisi === 'Semua'
      ? activeStaff
      : activeStaff.filter((s) => s.divisi === selectedDivisi);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              Direktori & Jadwal Jaga
            </p>
            <h1 className="mt-1 font-heading text-3xl font-extrabold text-slate-950">
              Jadwal Dokter & Tim Paramedic
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Daftar tenaga medis resmi RS Kota Baru (KBR) beserta jadwal shift operasional dan status
              bertugas saat ini.
            </p>
          </div>
          <Link
            to="/layanan?tab=Janji+Temu+Poli"
            className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-900"
          >
            <Calendar className="h-4 w-4" />
            Buat Janji Temu Dokter
          </Link>
        </div>

        {/* Filter Divisi */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filter Divisi:
          </span>
          {divisions.map((div) => (
            <button
              key={div}
              type="button"
              onClick={() => setSelectedDivisi(div)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedDivisi === div
                  ? 'bg-red-800 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-red-300'
              }`}
            >
              {div}
            </button>
          ))}
        </div>

        {/* Grid Daftar Dokter & Staf */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => {
            const badge = getDutyStatusBadge(staff.statusDuty);
            return (
              <div
                key={staff.uid}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-800">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="mt-4 font-heading text-base font-bold text-slate-900">
                    {formatStaffDisplayName(staff)}
                  </h3>
                  <p className="text-xs font-semibold text-red-700">{staff.role}</p>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">NIP Medis</span>
                      <span className="font-mono font-semibold text-slate-800">{staff.nip}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Divisi Pelayanan</span>
                      <span className="font-semibold text-slate-800">{staff.divisi}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Jadwal Shift
                      </span>
                      <span className="font-medium text-slate-700">{staff.jadwalShift}</span>
                    </div>
                  </div>
                </div>

                {['Doctor', 'Doctor Specialist', 'Deputy Director', 'Director'].includes(
                  staff.role
                ) && (
                  <Link
                    to="/layanan?tab=Janji+Temu+Poli"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-800 transition hover:border-red-800 hover:bg-red-800 hover:text-white"
                  >
                    Jadwalkan Konsultasi
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <Shield className="h-4 w-4 shrink-0 text-red-700" />
          <span>
            Kebijakan Privasi RS Kota Baru: Hanya identitas medis resmi (Nama IC, Gelar, Pangkat,
            dan NIP) yang ditampilkan ke publik.
          </span>
        </div>
      </div>
    </div>
  );
}