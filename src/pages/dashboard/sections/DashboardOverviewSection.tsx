import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Megaphone,
  Search,
  ShieldCheck,
  Stethoscope,
  Trophy,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { ROLE_LEVELS } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import { MonthYearCalendarPicker } from '../components/MonthYearCalendarPicker';
import { WeekRangeDropdown } from '../components/WeekRangeDropdown';
import { BULAN_INDO } from '../constants';
import type { DutySessionLogEntry, PortalStaffMember, WeekPeriodOption } from '../types';
import { computeWeeklySalary, formatRupiah, getTargetJamMingguan, parseLogDate } from '../utils';

interface DashboardOverviewSectionProps {
  currentUser: PortalStaffMember;
  activeStaffList: PortalStaffMember[];
  dutyLogs: DutySessionLogEntry[];
  weekOptions: WeekPeriodOption[];
  selectedWeekId: string;
  onSelectWeekId: (id: string) => void;
  targetJamSaya: number;
  menitMingguanSaya: number;
  menitBulananSaya: number;
  totalJamGlobal: number;
  onNotify?: (msg: string) => void;
}

interface LeaderboardEntry {
  rank: number;
  staff: PortalStaffMember;
  sessionCount: number;
  menit: number;
  jam: number;
  targetJam: number;
  progressPct: number;
  isTargetReached: boolean;
  estimasiGaji: number;
  pokok: number;
  bonus: number;
}

function formatJamMenit(totalMenit: number): string {
  const safe = Math.max(0, Math.round(totalMenit));
  const jam = Math.floor(safe / 60);
  const menit = safe % 60;
  return `${jam}j ${menit}m`;
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

function resolveStaffPhoto(staff: unknown, fallbackUid?: string): string {
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
  }

  const uid =
    (staff && typeof staff === 'object' && typeof (staff as { uid?: unknown }).uid === 'string'
      ? (staff as { uid: string }).uid
      : '') || fallbackUid;

  if (uid && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(`rskb_avatar_${uid}`);
      if (saved && saved.trim().length > 0) {
        return saved.trim();
      }
    } catch {
      // Abaikan error akses localStorage
    }
  }

  return '';
}

export function DashboardOverviewSection({
  currentUser,
  activeStaffList,
  dutyLogs,
  weekOptions,
  selectedWeekId,
  onSelectWeekId,
  targetJamSaya,
  menitMingguanSaya,
  menitBulananSaya,
  totalJamGlobal,
  onNotify,
}: DashboardOverviewSectionProps) {
  const [leaderboardMode, setLeaderboardMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(10); // November
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetFilter, setTargetFilter] = useState<'all' | 'reached' | 'below' | 'me'>('all');
  const [inspectedRow, setInspectedRow] = useState<LeaderboardEntry | null>(null);

  const notify = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
    }
  };

  const selectedWeekIndex = useMemo(() => {
    const idx = weekOptions.findIndex((w) => w.id === selectedWeekId);
    return idx >= 0 ? idx : 0;
  }, [weekOptions, selectedWeekId]);

  const selectedWeekObj = weekOptions[selectedWeekIndex] ?? weekOptions[0];

  const handleStepWeek = (delta: number) => {
    const nextIdx = selectedWeekIndex + delta;
    if (nextIdx >= 0 && nextIdx < weekOptions.length) {
      onSelectWeekId(weekOptions[nextIdx].id);
    }
  };

  const myRecentSessions = useMemo(() => {
    return dutyLogs
      .filter((l) => l.staffUid === currentUser.uid)
      .slice(0, 4);
  }, [dutyLogs, currentUser.uid]);

  const myWeeklySalary = useMemo(
    () => computeWeeklySalary(currentUser.role, menitMingguanSaya, targetJamSaya),
    [currentUser.role, menitMingguanSaya, targetJamSaya]
  );

  const weeklyProgressPct = useMemo(() => {
    if (targetJamSaya <= 0) return 0;
    return Math.min(100, Math.round(((menitMingguanSaya / 60) / targetJamSaya) * 100));
  }, [menitMingguanSaya, targetJamSaya]);

  const remainingHoursWeekly = useMemo(() => {
    const diff = targetJamSaya - menitMingguanSaya / 60;
    return Math.max(0, Number(diff.toFixed(1)));
  }, [targetJamSaya, menitMingguanSaya]);

  const myMonthlySessionCount = useMemo(() => {
    return dutyLogs.filter((l) => {
      if (l.staffUid !== currentUser.uid) return false;
      const d = parseLogDate(l.waktuMulai);
      if (!d) return false;
      return d.getFullYear() === 2026 && d.getMonth() === 10;
    }).length;
  }, [dutyLogs, currentUser.uid]);

  const avgHoursPerSessionMonth = useMemo(() => {
    if (myMonthlySessionCount <= 0) return '0.0';
    return ((menitBulananSaya / 60) / myMonthlySessionCount).toFixed(1);
  }, [menitBulananSaya, myMonthlySessionCount]);

  const computeRankedEntries = (mode: 'weekly' | 'monthly'): LeaderboardEntry[] => {
    const multiplier = mode === 'monthly' ? 4 : 1;

    const raw = activeStaffList.map((stf) => {
      const matchingLogs = dutyLogs.filter((l) => {
        if (l.staffUid !== stf.uid) return false;
        const d = parseLogDate(l.waktuMulai);
        if (!d) return true;

        if (mode === 'weekly') {
          if (!selectedWeekObj) return true;
          return d >= selectedWeekObj.startDate && d <= selectedWeekObj.endDate;
        }

        return d.getFullYear() === selectedMonthYear && d.getMonth() === selectedMonthIndex;
      });

      const menit = matchingLogs.reduce((acc, l) => acc + l.durasiMenit, 0);
      const jam = Number((menit / 60).toFixed(2));
      const targetJam = getTargetJamMingguan(stf.role) * multiplier;
      const isTargetReached = jam >= targetJam && targetJam > 0;
      const progressPct =
        targetJam > 0 ? Math.min(100, Math.round((jam / targetJam) * 100)) : 0;

      const weeklyCalc = computeWeeklySalary(
        stf.role,
        mode === 'weekly' ? menit : Math.round(menit / 4),
        getTargetJamMingguan(stf.role)
      );

      const estimasiGaji =
        mode === 'weekly'
          ? weeklyCalc.total
          : Math.round((menit / 60) * 100000);

      return {
        rank: 0,
        staff: stf,
        sessionCount: matchingLogs.length,
        menit,
        jam,
        targetJam,
        progressPct,
        isTargetReached,
        estimasiGaji,
        pokok: mode === 'weekly' ? weeklyCalc.pokok : estimasiGaji,
        bonus: mode === 'weekly' ? weeklyCalc.bonus : 0,
      };
    });

    raw.sort((a, b) => b.menit - a.menit || b.sessionCount - a.sessionCount);
    return raw.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  };

  const weeklyRanked = useMemo(
    () => computeRankedEntries('weekly'),
    [activeStaffList, dutyLogs, selectedWeekObj]
  );

  const monthlyRanked = useMemo(
    () => computeRankedEntries('monthly'),
    [activeStaffList, dutyLogs, selectedMonthYear, selectedMonthIndex]
  );

  const activeRanked = leaderboardMode === 'weekly' ? weeklyRanked : monthlyRanked;

  const myWeeklyRank = useMemo(() => {
    const found = weeklyRanked.find((r) => r.staff.uid === currentUser.uid);
    return found?.rank ?? activeStaffList.length;
  }, [weeklyRanked, currentUser.uid, activeStaffList.length]);

  const myMonthlyRank = useMemo(() => {
    const found = monthlyRanked.find((r) => r.staff.uid === currentUser.uid);
    return found?.rank ?? activeStaffList.length;
  }, [monthlyRanked, currentUser.uid, activeStaffList.length]);

  const filteredLeaderboard = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeRanked.filter((row) => {
      if (targetFilter === 'reached' && !row.isTargetReached) return false;
      if (targetFilter === 'below' && row.isTargetReached) return false;
      if (targetFilter === 'me' && row.staff.uid !== currentUser.uid) return false;

      if (!q) return true;
      const displayName = formatStaffDisplayName(row.staff).toLowerCase();
      return (
        row.staff.namaIc.toLowerCase().includes(q) ||
        displayName.includes(q) ||
        row.staff.role.toLowerCase().includes(q) ||
        row.staff.divisi.toLowerCase().includes(q)
      );
    });
  }, [activeRanked, targetFilter, searchQuery, currentUser.uid]);

  const topThree = filteredLeaderboard.slice(0, 3);
  const onDutyDoctors = useMemo(
    () => activeStaffList.filter((s) => s.role.toLowerCase().includes('doctor')).slice(0, 3),
    [activeStaffList]
  );

  const userFoto = resolveStaffPhoto(currentUser, currentUser.uid);
  const userJoined = (currentUser as { tanggalBergabung?: string }).tanggalBergabung ?? '2026-11-02';

  const handleCopyLeaderboardSummary = () => {
    const periodText =
      leaderboardMode === 'weekly'
        ? `Mingguan (${selectedWeekObj?.shortRange ?? 'Periode Ini'})`
        : `Bulanan (${BULAN_INDO[selectedMonthIndex]} ${selectedMonthYear})`;

    const lines = [
      `Leaderboard Jam Duty RS KotaBaru — ${periodText}`,
      ...filteredLeaderboard.slice(0, 10).map(
        (r) =>
          `#${r.rank} ${formatStaffDisplayName(r.staff)} (${r.staff.role}) — ${formatJamMenit(r.menit)} / ${r.targetJam}j (${r.progressPct}%)`
      ),
    ];

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
    notify('Ringkasan leaderboard berhasil disalin ke clipboard.');
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner Personel */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5E0B12] via-[#8B1515] to-[#A61C24] p-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 opacity-15">
          <Activity className="h-52 w-52 stroke-[2.2]" />
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {userFoto ? (
              <img
                src={userFoto}
                alt={formatStaffDisplayName(currentUser)}
                className="h-20 w-20 rounded-2xl border-2 border-white/30 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/15 font-heading text-xl font-extrabold text-white backdrop-blur-xs">
                {getInitials(formatStaffDisplayName(currentUser))}
              </div>
            )}
            <span className="mt-1.5 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              - Aktif
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-100">
                LEVEL {ROLE_LEVELS[currentUser.role] ?? 1} · {currentUser.role.toUpperCase()}
              </span>
              <span className="rounded-md bg-black/25 px-2.5 py-0.5 text-[10px] font-semibold text-rose-100">
                Divisi {currentUser.divisi}
              </span>
            </div>

            <h2 className="mt-2 font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Selamat Bertugas, {formatStaffDisplayName(currentUser)}
            </h2>

            <p className="mt-1 text-xs text-rose-100/90">
              NIP / Staff ID:{' '}
              <span className="font-mono font-bold text-white">{currentUser.nip}</span> · Bergabung:{' '}
              <span className="font-mono font-semibold text-white">{userJoined}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Empat Kartu KPI Utama */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Duty Minggu Ini */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#8B1515]" />
              DUTY MINGGU INI
            </span>
            <span className="font-normal normal-case text-slate-400">
              {myRecentSessions.length} Sesi
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-2xl font-extrabold text-slate-900">
              {formatJamMenit(menitMingguanSaya)}
            </span>
            <span className="text-xs font-medium text-slate-400">/ {targetJamSaya}j Target</span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#8B1515] transition-all"
              style={{ width: `${weeklyProgressPct}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Activity className="h-3 w-3 text-[#8B1515]" />
              {remainingHoursWeekly > 0
                ? `Kurang ${remainingHoursWeekly}j lagi`
                : 'Target mingguan tercapai'}
            </span>
            <span className="font-mono font-bold text-slate-500">{weeklyProgressPct}%</span>
          </div>
        </div>

        {/* KPI 2: Estimasi Gaji Minggu Ini */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              ESTIMASI GAJI MINGGU INI
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold normal-case text-amber-700">
              Berjalan
            </span>
          </div>

          <p className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
            {formatRupiah(myWeeklySalary.total)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pokok: {formatRupiah(myWeeklySalary.pokok)}
            {myWeeklySalary.bonus > 0 ? ` · Bonus: +${formatRupiah(myWeeklySalary.bonus)}` : ''}
          </p>
          <p className="mt-3 text-[11px] text-slate-400">
            Periode: {selectedWeekObj?.shortRange ?? 'Minggu Berjalan'}
          </p>
        </div>

        {/* KPI 3: Duty Bulan Ini */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#8B1515]" />
              DUTY BULAN INI
            </span>
            <span className="font-normal normal-case text-slate-400">November 2026</span>
          </div>

          <p className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
            {formatJamMenit(menitBulananSaya)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Total {myMonthlySessionCount} sesi tugas pada bulan ini
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <span>↗ Rata-rata: {avgHoursPerSessionMonth}j per sesi</span>
          </p>
        </div>

        {/* KPI 4: Peringkat Saya */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              PERINGKAT SAYA
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold normal-case text-amber-700">
              Staff Medis
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-2xl font-extrabold text-slate-900">
              #{myWeeklyRank}
            </span>
            <span className="text-xs text-slate-500">Minggu Ini</span>
            <span className="text-slate-300">/</span>
            <span className="font-heading text-lg font-extrabold text-slate-700">
              #{myMonthlyRank}
            </span>
            <span className="text-xs text-slate-500">Bulan Ini</span>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Dari total {activeStaffList.length} tenaga medis aktif di database
          </p>
        </div>
      </section>

      {/* 3. Riwayat Sesi Duty Terakhir Saya */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <Clock className="h-3.5 w-3.5 text-[#8B1515]" />
            RIWAYAT SESI DUTY TERAKHIR SAYA
          </h3>
          <span className="text-[11px] text-slate-400">
            Menampilkan {myRecentSessions.length} sesi terbaru
          </span>
        </div>

        {myRecentSessions.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 py-6 text-center text-xs text-slate-400">
            Belum ada riwayat sesi duty tercatat untuk akun ini.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {myRecentSessions.map((sesi) => {
              const datePart = sesi.waktuMulai.split(' ')[0] || sesi.waktuMulai;
              const startClock = sesi.waktuMulai.split(' ')[1] || '--:--';
              const endClock = sesi.waktuSelesai
                ? sesi.waktuSelesai.split(' ')[1] || sesi.waktuSelesai
                : 'Aktif';

              return (
                <div
                  key={sesi.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      {datePart}
                    </span>
                    <span className="text-xs font-extrabold text-[#8B1515]">
                      {sesi.durasiMenit} Menit
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    {startClock} - {endClock}
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Sebagai:{' '}
                    <strong className="font-semibold text-slate-700">{currentUser.role}</strong>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Informasi, Pengumuman & Status Operasional Medis */}
      <section className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex h-6 flex-wrap items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 font-heading text-base font-extrabold leading-none text-slate-900">
              <Megaphone className="h-4 w-4 shrink-0 text-[#8B1515]" />
              <span>Informasi, Pengumuman &amp; Operasional Medis</span>
            </h3>
            <span className="text-[11px] leading-none text-slate-400">Update: 2026-11-24</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-[#8B1515]">
                <SparklesIcon />
                Pengumuman Resmi Paramedic
              </span>
              <span className="font-mono text-[11px] text-slate-400">2026-11-24</span>
            </div>

            <h4 className="mt-3 font-heading text-base font-extrabold text-slate-900">
              Kebijakan Target Jam Duty &amp; Sistem Penggajian Terintegrasi
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Seluruh staf medis diharapkan memenuhi target jam kerja mingguan sesuai jenjang
              jabatan masing-masing. Staf yang mencapai target jam duty berhak mendapatkan gaji
              utuh serta bonus tambahan untuk setiap kelebihan jam duty. Rekapitulasi absensi dan
              slip gaji tersinkronisasi secara real-time.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <p className="text-[11px] font-bold text-slate-700">Target Jam Duty Mingguan:</p>
                <p className="mt-1 text-xs text-slate-600">
                  Jabatan Anda ({currentUser.role}):{' '}
                  <strong className="text-slate-900">{targetJamSaya} Jam/Minggu</strong>
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <p className="text-[11px] font-bold text-slate-700">Sistem Bonus Kelebihan Jam:</p>
                <p className="mt-1 text-xs text-slate-600">
                  Setiap kelipatan 0.5 Jam di atas target:{' '}
                  <strong className="text-emerald-700">+{formatRupiah(15000)}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h4 className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8B1515]" />
              REGULASI &amp; SOP AKTIF RUMAH SAKIT
            </h4>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#8B1515]">
                  Pengobatan &amp; Tarif Utama
                </span>
                <p className="mt-2 font-heading text-xs font-extrabold text-slate-900">
                  Regulasi Resmi Rumah Sakit Kota Baru
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Pedoman layanan klinis &amp; tarif tindakan medis
                </p>
                <p className="mt-2.5 text-[10px] text-slate-400">
                  Oleh: {formatStaffDisplayName(currentUser)} · 2026-11-20
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#8B1515]">
                  Prosedur Operasional Standar
                </span>
                <p className="mt-2 font-heading text-xs font-extrabold text-slate-900">
                  SOP Triage IGD &amp; Disiplin Duty
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Aturan shift, pelaporan log, dan penanganan darurat
                </p>
                <p className="mt-2.5 text-[10px] text-slate-400">
                  Oleh: Manajemen RSKB · 2026-11-12
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Status Operasional Medis */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex h-6 items-center">
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase leading-none tracking-wider text-slate-500">
              <Activity className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />
              <span>STATUS OPERASIONAL MEDIS</span>
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  Tenaga Medis Aktif
                </span>
                <span className="font-heading font-extrabold text-slate-900">
                  {activeStaffList.length} Orang
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                  Dokter Siaga Bertugas
                </span>
                <span className="font-heading font-extrabold text-slate-900">
                  {Math.max(1, onDutyDoctors.length)} Dokter
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  Status Rekrutmen
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">
                  DIBUKA
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                DOKTER JAGA TERSEDIA
              </p>
              <div className="mt-2.5 space-y-2.5">
                {(onDutyDoctors.length > 0 ? onDutyDoctors : activeStaffList.slice(0, 2)).map(
                  (doc, idx) => (
                    <div
                      key={doc.uid}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {formatStaffDisplayName(doc)}
                        </p>
                        <p className="text-[11px] text-slate-500">{doc.role}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-500">
                        {idx === 0 ? '18:00 - 23:00' : '19:00 - 00:00'}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Leaderboard Jam Duty Mingguan & Bulanan */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="inline-flex items-center gap-2 font-heading text-lg font-extrabold text-slate-900">
              <Trophy className="h-5 w-5 text-amber-500" />
              Leaderboard Jam Duty Paramedic Kota Baru
            </h3>
            <p className="text-xs text-slate-500">
              Peringkat jam kerja &amp; keaktifan tenaga medis. Terintegrasi penuh dengan log
              absensi realtime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLeaderboardMode('weekly')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  leaderboardMode === 'weekly'
                    ? 'bg-[#8B1515] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Leaderboard Mingguan
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardMode('monthly')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  leaderboardMode === 'monthly'
                    ? 'bg-[#8B1515] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Leaderboard Bulanan
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLeaderboardSummary}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
              title="Salin ringkasan peringkat"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              Salin Rekap
            </button>
          </div>
        </div>

        {/* Kontrol Periode & Pencarian */}
        <div className="flex flex-col justify-between gap-3 border-y border-slate-100 py-3.5 lg:flex-row lg:items-center">
          {leaderboardMode === 'weekly' ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Periode Minggu:</span>
              <button
                type="button"
                disabled={selectedWeekIndex >= weekOptions.length - 1}
                onClick={() => handleStepWeek(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Minggu sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="rounded-lg bg-[#8B1515] px-3 py-1.5 font-bold text-white">
                {selectedWeekObj?.isCurrent ? 'Minggu Berjalan' : 'Arsip Mingguan'}
              </span>
              <button
                type="button"
                disabled={selectedWeekIndex <= 0}
                onClick={() => handleStepWeek(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Minggu berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <WeekRangeDropdown
                options={weekOptions}
                selectedId={selectedWeekId}
                onSelect={onSelectWeekId}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Periode Bulan:</span>
              <span className="rounded-lg bg-[#8B1515] px-3 py-1.5 font-bold text-white">
                Bulan Ini ({BULAN_INDO[selectedMonthIndex]} {selectedMonthYear})
              </span>
              <MonthYearCalendarPicker
                year={selectedMonthYear}
                monthIndex={selectedMonthIndex}
                onChange={(y, m) => {
                  setSelectedMonthYear(y);
                  setSelectedMonthIndex(m);
                }}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama staff / jabatan..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          {(
            [
              { id: 'all', label: `Semua (${activeRanked.length})` },
              {
                id: 'reached',
                label: `Capai Target (${activeRanked.filter((r) => r.isTargetReached).length})`,
              },
              {
                id: 'below',
                label: `Di Bawah Target (${activeRanked.filter((r) => !r.isTargetReached).length})`,
              },
              { id: 'me', label: 'Posisi Saya' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setTargetFilter(chip.id)}
              className={`rounded-lg px-2.5 py-1 transition ${
                targetFilter === chip.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium Cards */}
        {topThree.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {topThree.map((row) => {
              const isFirst = row.rank === 1;
              const isMe = row.staff.uid === currentUser.uid;
              const foto = resolveStaffPhoto(row.staff, isMe ? currentUser.uid : undefined);

              return (
                <div
                  key={row.staff.uid}
                  onClick={() => setInspectedRow(row)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setInspectedRow(row);
                  }}
                  className={`cursor-pointer rounded-2xl border p-4 transition hover:shadow-sm ${
                    isFirst
                      ? 'border-amber-300/90 bg-gradient-to-b from-amber-50/70 to-white'
                      : isMe
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`font-heading text-sm font-extrabold ${
                          isFirst ? 'text-amber-600' : 'text-slate-700'
                        }`}
                      >
                        #{row.rank}
                      </span>
                      {isFirst && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                          <Trophy className="h-3 w-3" />
                          JUARA 1
                        </span>
                      )}
                      {isMe && (
                        <span className="rounded-md bg-[#8B1515] px-2 py-0.5 text-[10px] font-extrabold text-white">
                          Akun Anda
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {row.sessionCount} Sesi Duty
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    {foto ? (
                      <img
                        src={foto}
                        alt={formatStaffDisplayName(row.staff)}
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-heading text-sm font-extrabold ${
                          isFirst
                            ? 'bg-amber-500 text-white'
                            : 'bg-[#8B1515] text-white'
                        }`}
                      >
                        {getInitials(formatStaffDisplayName(row.staff))}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-extrabold text-slate-900">
                        {formatStaffDisplayName(row.staff)}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {row.staff.role} (Lv.{ROLE_LEVELS[row.staff.role] ?? 1})
                      </p>
                      <p className="mt-0.5 font-heading text-base font-extrabold text-slate-900">
                        {formatJamMenit(row.menit)}{' '}
                        <span className="text-[11px] font-normal text-slate-400">total jam</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                    <span className="text-slate-500">Target: {row.targetJam} Jam</span>
                    {row.isTargetReached ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <UserCheck className="h-3.5 w-3.5" />
                        Tercapai
                      </span>
                    ) : (
                      <span className="font-mono font-semibold text-slate-400">
                        {row.progressPct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabel Peringkat Lengkap */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div>
              <h4 className="font-heading text-sm font-extrabold text-slate-900">
                Peringkat Lengkap Seluruh Tenaga Medis Aktif
              </h4>
              <p className="text-[11px] text-slate-400">
                Baris akun Anda di-highlight secara khusus · Klik baris untuk melihat rincian.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total: {activeStaffList.length} Anggota Medis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-center">RANK</th>
                  <th className="px-4 py-3 text-left">STAFF MEDIS</th>
                  <th className="px-4 py-3 text-left">JABATAN</th>
                  <th className="px-4 py-3 text-center">JUMLAH SESI</th>
                  <th className="px-4 py-3 text-center">TOTAL JAM DUTY</th>
                  <th className="px-4 py-3 text-center">STATUS TARGET</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada data staff yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((row) => {
                    const isMe = row.staff.uid === currentUser.uid;
                    const foto = resolveStaffPhoto(row.staff, isMe ? currentUser.uid : undefined);

                    return (
                      <tr
                        key={row.staff.uid}
                        onClick={() => setInspectedRow(row)}
                        className={`cursor-pointer transition ${
                          isMe
                            ? 'bg-rose-50/70 hover:bg-rose-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">
                          #{row.rank}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2.5">
                            {foto ? (
                              <img
                                src={foto}
                                alt={formatStaffDisplayName(row.staff)}
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 font-heading text-[10px] font-extrabold text-slate-700">
                                {getInitials(formatStaffDisplayName(row.staff))}
                              </span>
                            )}
                            <span className="font-bold text-slate-900">
                              {formatStaffDisplayName(row.staff)}
                            </span>
                            {isMe && (
                              <span className="rounded bg-[#8B1515] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                                ANDA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left text-slate-600">
                          {row.staff.role} (Lv.{ROLE_LEVELS[row.staff.role] ?? 1})
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600">
                          {row.sessionCount} sesi
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                          {formatJamMenit(row.menit)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isTargetReached ? (
                            <span className="inline-flex items-center justify-center rounded-md bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
                              Tercapai ({row.jam}/{row.targetJam}j)
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-500">
                              {row.progressPct}% ({row.jam}/{row.targetJam}j)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal Detail Performa Personel */}
      {inspectedRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setInspectedRow(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#8B1515]">
                  PERINGKAT #{inspectedRow.rank}
                </span>
                <h4 className="mt-1 font-heading text-base font-extrabold text-slate-900">
                  {formatStaffDisplayName(inspectedRow.staff)}
                </h4>
                <p className="text-xs text-slate-500">
                  {inspectedRow.staff.role} · Divisi {inspectedRow.staff.divisi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedRow(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Durasi Duty</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatJamMenit(inspectedRow.menit)} ({inspectedRow.jam} Jam)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Periode</span>
                <span className="font-mono font-bold text-slate-900">
                  {inspectedRow.targetJam} Jam ({inspectedRow.progressPct}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Sesi Tercatat</span>
                <span className="font-mono font-bold text-slate-900">
                  {inspectedRow.sessionCount} Sesi
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2.5">
                <span className="font-semibold text-slate-700">Estimasi Pendapatan</span>
                <span className="font-heading text-sm font-extrabold text-[#8B1515]">
                  {formatRupiah(inspectedRow.estimasiGaji)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedRow(null)}
                className="rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
    </svg>
  );
}