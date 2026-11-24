import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Activity,
  FileCheck2,
  HeartPulse,
  LayoutDashboard,
  LogIn,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { formatStaffDisplayName } from '@/utils/formatters';

export function Navbar() {
  const { currentUser, staffList } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onDutyCount = staffList.filter(
    (s) => s.statusAkun === 'aktif' && s.statusDuty === 'on_duty'
  ).length;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? 'text-[#9E1B21] font-semibold'
        : 'text-slate-600 hover:text-[#9E1B21]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/95 backdrop-blur">
      <div className="bg-[#8B151B] px-4 py-1.5 text-xs text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-3.5 w-3.5 text-rose-200" />
            <span>
              Pillbox Medical Center, Koordinat 201 — Kota Baru Roleplay (KBR) · Siaga IGD 24/7
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-0.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{onDutyCount} Tenaga Medis On-Duty</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9E1B21] text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-base font-bold leading-tight text-slate-900">
              Portal Layanan Paramedic
            </p>
            <p className="text-xs text-slate-500">
              RS Kota Baru · Kota Baru Roleplay (KBR)
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <NavLink to="/layanan" className={navLinkClass}>
            Layanan Medis
          </NavLink>
          <NavLink to="/jadwal-dokter" className={navLinkClass}>
            Jadwal Dokter
          </NavLink>
          <NavLink to="/regulasi" className={navLinkClass}>
            Regulasi Pengobatan
          </NavLink>
          <NavLink to="/keluhan" className={navLinkClass}>
            Keluhan Warga
          </NavLink>
          <NavLink to="/verify" className={navLinkClass}>
            <span className="inline-flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5" />
              Verifikasi Surat
            </span>
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            to="/recruitment"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-semibold text-[#9E1B21] transition hover:bg-rose-100"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Recruitment Paramedic
          </Link>

          {currentUser ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#9E1B21] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#7F151A]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {formatStaffDisplayName(currentUser)}
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#9E1B21] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#7F151A]"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login Staff
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
          aria-label="Menu Navigasi"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/layanan" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Layanan Medis (8 Modul)
            </NavLink>
            <NavLink to="/jadwal-dokter" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Jadwal Dokter & Tim On-Duty
            </NavLink>
            <NavLink to="/regulasi" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Regulasi Pengobatan & Tarif
            </NavLink>
            <NavLink to="/keluhan" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Kotak Keluhan & Aspirasi Warga
            </NavLink>
            <NavLink to="/verify" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Verifikasi Keaslian Surat (QR)
            </NavLink>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link
                to="/recruitment"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-[#9E1B21]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Recruitment
              </Link>
              <Link
                to={currentUser ? '/dashboard' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#9E1B21] px-3 py-2 text-xs font-semibold text-white"
              >
                <LogIn className="h-3.5 w-3.5" />
                {currentUser ? 'Dashboard Staf' : 'Login Staff'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}