import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MapPin, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-rose-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9E1B21] text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Rumah Sakit Kotabaru
              </h3>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-[#9E1B21]" />
                Pillbox Medical Center, Koordinat 201 — Kota Baru Roleplay (KBR)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#9E1B21]">
            <span>Terpercaya</span>
            <span>·</span>
            <span>Siaga 24/7</span>
            <span>·</span>
            <span>Profesional</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Link to="/verify" className="inline-flex items-center gap-1 hover:text-[#9E1B21]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#9E1B21]" />
              Cek Keaslian Surat
            </Link>
            <span>© 2026 Rumah Sakit Kotabaru.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}