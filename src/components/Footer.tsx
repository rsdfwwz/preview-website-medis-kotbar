import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
              <img
                src="/logo.png"
                alt="Logo RS Kota Baru (KBRP)"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-heading text-sm font-extrabold text-slate-900">
                Rumah Sakit Kota Baru (KBRP)
              </h3>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-red-700" />
                Pillbox Medical Center, Koordinat 201 · Siaga Darurat 911
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <Link to="/layanan" className="hover:text-red-700">
              Layanan Warga
            </Link>
            <Link to="/jadwal-dokter" className="hover:text-red-700">
              Jadwal Dokter
            </Link>
            <Link to="/regulasi" className="hover:text-red-700">
              Tarif & SKWB
            </Link>
            <Link to="/keluhan" className="hover:text-red-700">
              Aspirasi & Keluhan
            </Link>
            <Link
              to="/verify"
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-red-800 hover:bg-red-100"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Cek Dokumen
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-[11px] text-slate-400 sm:flex-row">
          <span>© 2026 Paramedic & Rumah Sakit Kota Baru (KBRP). Seluruh hak cipta dilindungi.</span>
          <span>Farmasi 24 Jam · Perlindungan Privasi Identitas Staff Terjamin</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;