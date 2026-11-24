import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

export function RegulationsPage() {
  const { regulations } = usePortal();

  const categories = [
    'Administrasi & Surat',
    'Poli & Tindakan Medis',
    'Bedah & Forensik',
    'Benefit Warga Baru (SKWB)',
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-[#8B1515] to-[#4A0A0A] p-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-red-100">
            <BookOpen className="h-3.5 w-3.5" />
            Standar Tarif & SOP Pelayanan KBR
          </div>
          <h1 className="mt-3 font-heading text-3xl font-extrabold">
            Regulasi Pengobatan & Tarif Resmi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-red-100/85">
            Seluruh biaya tindakan medis, administrasi surat-menyurat, paket farmasi, dan hak
            benefit Warga Baru (SKWB) diatur secara transparan oleh Manajemen RS Kota Baru.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {categories.map((cat) => {
            const items = regulations.filter((r) => r.kategori === cat);
            return (
              <div
                key={cat}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">{cat}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-heading text-sm font-bold text-slate-900">
                          {item.namaTindakan}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.keterangan}</p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-red-50 px-3.5 py-1.5 font-mono text-xs font-bold text-red-800">
                        {item.tarifKbrp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/70 p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-red-800" />
            <div>
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Pemegang Surat Keterangan Warga Baru (SKWB)?
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Klaim Gratis Operasi Plastik 1x, Diskon 50% Treatment, dan Gratis 1x Paket Perban
                selama 7 hari pertama di kota.
              </p>
            </div>
          </div>
          <Link
            to="/layanan?tab=Klaim+Benefit+SKWB"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-900"
          >
            Klaim Benefit SKWB
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}