import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LogIn,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatStaffDisplayName } from '../utils/formatters';

export function Navbar() {
  const { currentUser, staffList } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  const onDutyCount = (staffList ?? []).filter(
    (s) => s.statusAkun === 'aktif' && s.statusDuty === 'on_duty'
  ).length;

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
      isActive
        ? 'bg-red-50 text-red-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Kiri: Logo SVG & Nama Instansi */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            <img
              src={logoSrc}
              alt="Logo RS Kota Baru"
              className="h-full w-full object-contain"
              onError={() => {
                if (logoSrc !== '/logo.png') {
                  setLogoSrc('/logo.png');
                }
              }}
            />
          </div>

          <div className="leading-tight">
            <span className="block font-heading text-sm font-extrabold tracking-tight text-slate-900">
              Portal Layanan Paramedic Kota Baru
            </span>
            <span className="block text-[11px] font-medium text-slate-500">
              Pillbox Medical Center · Koord. 201
            </span>
          </div>
        </Link>

        {/* Tengah: Menu Utama Rapi */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkStyle}>
            Beranda
          </NavLink>
          <NavLink to="/layanan" className={linkStyle}>
            Layanan Medis
          </NavLink>
          <NavLink to="/jadwal-dokter" className={linkStyle}>
            Jadwal Dokter
          </NavLink>
          <NavLink to="/regulasi" className={linkStyle}>
            Regulasi & Tarif
          </NavLink>
          <NavLink to="/keluhan" className={linkStyle}>
            Keluhan Warga
          </NavLink>
        </nav>

        {/* Kanan: Status Duty, Verifikasi QR & Portal Staff */}
        <div className="hidden items-center gap-2.5 md:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onDutyCount} Siaga</span>
          </div>

          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100/70"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-red-700" />
            Cek Dokumen
          </Link>

          {currentUser ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-900"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="max-w-[140px] truncate">{formatStaffDisplayName(currentUser)}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-900"
            >
              <LogIn className="h-3.5 w-3.5" />
              Portal Staff
            </Link>
          )}
        </div>

        {/* Tombol Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={linkStyle}>
              Beranda
            </NavLink>
            <NavLink to="/layanan" onClick={() => setMobileOpen(false)} className={linkStyle}>
              Layanan Medis
            </NavLink>
            <NavLink to="/jadwal-dokter" onClick={() => setMobileOpen(false)} className={linkStyle}>
              Jadwal Dokter
            </NavLink>
            <NavLink to="/regulasi" onClick={() => setMobileOpen(false)} className={linkStyle}>
              Regulasi & Tarif
            </NavLink>
            <NavLink to="/keluhan" onClick={() => setMobileOpen(false)} className={linkStyle}>
              Keluhan Warga
            </NavLink>
            <NavLink to="/verify" onClick={() => setMobileOpen(false)} className={linkStyle}>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-red-700" />
                <span>Cek Dokumen</span>
              </span>
            </NavLink>
            <Link
              to={currentUser ? '/dashboard' : '/login'}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-800 py-2 text-xs font-semibold text-white"
            >
              {currentUser ? 'Buka Dashboard Staff' : 'Masuk Portal Staff'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;