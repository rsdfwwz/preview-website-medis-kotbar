import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ROLE_LEVELS, ROLE_LIST } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import type { PortalStaffMember } from '../types';

interface StaffDirectorySectionProps {
  activeStaffList: PortalStaffMember[];
  onSelectStaff: (member: PortalStaffMember) => void;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/^(dr\.|ns\.|apt\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function resolveStaffPhoto(staff: unknown): string {
  if (staff && typeof staff === 'object') {
    const record = staff as Record<string, unknown>;
    const candidates = [
      record.fotoUrl,
      record.avatarUrl,
      record.photoUrl,
      record.foto,
      record.avatar,
    ];
    for (const val of candidates) {
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = [
        typeof record.uid === 'string' && record.uid ? `rskb_avatar_${record.uid}` : '',
        typeof record.nip === 'string' && record.nip ? `rskb_avatar_${record.nip}` : '',
      ].filter(Boolean);

      for (const k of keys) {
        try {
          const saved = window.localStorage.getItem(k);
          if (saved && saved.trim().length > 0) {
            return saved.trim();
          }
        } catch {
          // Abaikan error akses localStorage
        }
      }
    }
  }
  return '';
}

export function StaffDirectorySection({
  activeStaffList,
  onSelectStaff,
}: StaffDirectorySectionProps) {
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  const staffSectionsByRole = useMemo(() => {
    const q = staffSearchQuery.trim().toLowerCase();
    const filtered = activeStaffList.filter((stf) => {
      if (!q) return true;
      return (
        formatStaffDisplayName(stf).toLowerCase().includes(q) ||
        stf.namaIc.toLowerCase().includes(q) ||
        stf.role.toLowerCase().includes(q) ||
        stf.divisi.toLowerCase().includes(q) ||
        stf.nip.toLowerCase().includes(q)
      );
    });

    const orderedRoles = [...ROLE_LIST].sort(
      (a, b) => (ROLE_LEVELS[b] || 0) - (ROLE_LEVELS[a] || 0)
    );

    return orderedRoles
      .map((roleName) => ({
        roleName,
        level: ROLE_LEVELS[roleName] || 1,
        members: filtered.filter((s) => s.role === roleName),
      }))
      .filter((sec) => sec.members.length > 0);
  }, [activeStaffList, staffSearchQuery]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Direktori Anggota Staff Aktif
            </h2>
            <p className="text-xs text-slate-500">
              Dikelompokkan per section jabatan (Role) dari level tertinggi ke terendah.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              placeholder="Cari nama atau jabatan..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs focus:border-[#8B1515] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {staffSectionsByRole.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
          Tidak ada anggota staff yang cocok dengan pencarian "{staffSearchQuery}".
        </div>
      ) : (
        <div className="space-y-6">
          {staffSectionsByRole.map((section) => (
            <section
              key={section.roleName}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-mono text-xs font-extrabold text-[#8B1515]">
                    Level {section.level}
                  </span>
                  <h3 className="font-heading text-base font-extrabold text-slate-900">
                    {section.roleName}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                  {section.members.length} Personel
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.members.map((stf) => {
                  const foto = resolveStaffPhoto(stf);
                  const displayName = formatStaffDisplayName(stf);

                  return (
                    <div
                      key={stf.uid}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-red-200"
                    >
                      <div className="flex items-start gap-3">
                        {foto ? (
                          <img
                            src={foto}
                            alt={displayName}
                            className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B1515] font-heading text-xs font-extrabold text-white">
                            {getInitials(displayName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-extrabold text-slate-900">
                            {displayName}
                          </p>
                          <p className="text-xs font-semibold text-rose-700">
                            {stf.role} · Level {ROLE_LEVELS[stf.role]}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Divisi {stf.divisi} · {stf.nip}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectStaff(stf)}
                        className="mt-4 w-full rounded-xl border border-rose-100 bg-rose-50/40 py-2 text-xs font-bold text-[#8B1515] transition hover:bg-rose-100/70"
                      >
                        Profil Selengkapnya
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}