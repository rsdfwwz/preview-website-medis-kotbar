import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Printer,
  RotateCcw,
  Wallet,
  X,
} from 'lucide-react';
import { ROLE_LEVELS } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import { BULAN_INDO } from '../constants';
import type {
  DutySessionLogEntry,
  OfficialPaySlipItem,
  PortalStaffMember,
  WeekPeriodOption,
} from '../types';
import { parseLogDate, toIsoDate } from '../utils';

interface MySalarySectionProps {
  currentUser: PortalStaffMember;
  dutyLogs: DutySessionLogEntry[];
  weekOptions: WeekPeriodOption[];
  selectedWeekId: string;
  onSelectWeekId: (weekId: string) => void;
  targetJamSaya: number;
  menitMingguanSaya: number;
  officialPaySlips: OfficialPaySlipItem[];
  onNotify?: (msg: string) => void;
}

interface PeriodDropdownItem {
  id: string;
  label: string;
  subLabel: string;
  year: number;
  monthIndex: number;
  weekRef?: WeekPeriodOption;
}

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const absVal = Math.round(Math.abs(amount));
  return `${sign}Rp ${absVal.toLocaleString('id-ID')}`;
}

function formatJamDesimal(minutes: number): string {
  const hours = minutes / 60;
  const fixed = hours.toFixed(2).replace(/\.?0+$/, '');
  return `${fixed || '0'} Jam`;
}

function formatMenitKeFormatJam(minutes: number): string {
  if (minutes < 60) return `${minutes} Menit`;
  const jam = minutes / 60;
  return `${jam.toFixed(2).replace(/\.?0+$/, '')} Jam`;
}

function formatTanggalIndo(ymd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return ymd;
  const y = Number(match[1]);
  const mIdx = Math.max(0, Math.min(11, Number(match[2]) - 1));
  const d = Number(match[3]);
  return `${d} ${BULAN_INDO[mIdx]} ${y}`;
}

function getUserLevelNumber(user: PortalStaffMember): number {
  const rec = user as unknown as Record<string, unknown>;
  const direct =
    typeof rec.roleLevel === 'number'
      ? rec.roleLevel
      : typeof rec.level === 'number'
        ? rec.level
        : undefined;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;

  const mapped =
    (ROLE_LEVELS as Record<string, number | undefined>)[user.role] ??
    (ROLE_LEVELS as Record<string, number | undefined>)[user.role?.toLowerCase() ?? ''];
  return typeof mapped === 'number' ? mapped : 1;
}

function normalizeSlipItem(raw: unknown, idx: number): OfficialPaySlipItem {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const gajiPokok = Number(r.gajiPokok ?? r.baseSalary ?? 0) || 0;
  const bonusDuty = Number(r.bonusDuty ?? r.overtimeBonus ?? 0) || 0;
  const tunjangan = Number(r.tunjanganTambahan ?? r.allowance ?? 0) || 0;
  const potongan = Number(r.potongan ?? r.deduction ?? 0) || 0;
  const takeHomePay =
    Number(r.takeHomePay ?? r.netSalary ?? gajiPokok + bonusDuty + tunjangan - potongan) || 0;

  return {
    id: String(r.id ?? `slip-${idx}`),
    staffUid: String(r.staffUid ?? ''),
    namaStaff: String(r.namaStaff ?? r.staffName ?? 'Staff RSKB'),
    jabatan: String(r.jabatan ?? r.role ?? 'Staff'),
    periodeId: String(r.periodeId ?? `period-${idx}`),
    periodeLabel: String(r.periodeLabel ?? r.periode ?? '16 – 22 Nov 2026'),
    totalJamDuty: Number(r.totalJamDuty ?? r.jamDuty ?? 0) || 0,
    gajiPokok,
    bonusDuty,
    tunjanganTambahan: tunjangan,
    potongan,
    takeHomePay,
    statusPembayaran:
      r.statusPembayaran === 'Pending' || r.status === 'Pending' ? 'Pending' : 'Paid',
    tanggalBayar: String(r.tanggalBayar ?? r.paidDate ?? '2026-11-22'),
  };
}

interface CustomDailyDatePickerProps {
  valueYmd: string;
  onChangeYmd: (ymd: string) => void;
  activeDatesSet: ReadonlySet<string>;
}

function CustomDailyDatePicker({
  valueYmd,
  onChangeYmd,
  activeDatesSet,
}: CustomDailyDatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedDateObj = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueYmd);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(2026, 10, 23);
  }, [valueYmd]);

  const [viewYear, setViewYear] = useState<number>(selectedDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDateObj.getMonth());

  useEffect(() => {
    setViewYear(selectedDateObj.getFullYear());
    setViewMonth(selectedDateObj.getMonth());
  }, [selectedDateObj]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: Array<{ day: number | null; ymd: string | null }> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      list.push({ day: null, ymd: null });
    }
    for (let d = 1; d <= totalDays; d += 1) {
      const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ day: d, ymd });
    }
    return list;
  }, [viewYear, viewMonth]);

  const stepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const pickPresetOffset = (offsetDays: number) => {
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays);
    const ymd = toIsoDate(target);
    onChangeYmd(ymd);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#8B1515] focus:border-[#8B1515] focus:outline-none"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-[#8B1515]" />
        <span className="text-[11px] font-bold text-slate-400">PILIH TGL:</span>
        <span className="font-mono text-xs font-bold text-slate-900">
          {formatTanggalIndo(valueYmd)}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-80 max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-1.5 pb-3">
            {[
              { label: 'Hari Ini', offset: 0 },
              { label: 'Kemarin', offset: -1 },
              { label: '2 Hari Lalu', offset: -2 },
              { label: '7 Hari Lalu', offset: -7 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => pickPresetOffset(chip.offset)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#8B1515]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-heading text-xs font-extrabold text-slate-900">
              {BULAN_INDO[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => stepMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase text-slate-400">
            {HARI_SINGKAT.map((h) => (
              <span key={h} className="py-1">
                {h}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
            {cells.map((cell, idx) => {
              if (!cell.day || !cell.ymd) {
                return <span key={`blank-${idx}`} className="h-8" />;
              }
              const isSelected = cell.ymd === valueYmd;
              const hasDuty = activeDatesSet.has(cell.ymd);
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  onClick={() => {
                    onChangeYmd(cell.ymd!);
                    setOpen(false);
                  }}
                  className={`relative flex h-8 w-full flex-col items-center justify-center rounded-lg font-mono text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#8B1515] text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-[#8B1515]'
                  }`}
                >
                  <span>{cell.day}</span>
                  {hasDuty && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ada log duty</span>
            </span>
            <span className="font-mono">{valueYmd}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface CustomPeriodDropdownProps {
  mode: 'mingguan' | 'bulanan';
  items: PeriodDropdownItem[];
  selectedItem?: PeriodDropdownItem;
  onSelectItem: (item: PeriodDropdownItem) => void;
}

function CustomPeriodDropdown({
  mode,
  items,
  selectedItem,
  onSelectItem,
}: CustomPeriodDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 transition hover:border-[#8B1515] focus:border-[#8B1515] focus:outline-none"
      >
        <span className="truncate">
          {selectedItem?.label ?? (mode === 'bulanan' ? 'Pilih Bulan' : 'Pilih Periode')}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {mode === 'bulanan' ? 'Pilih Periode Bulanan' : 'Pilih Periode Mingguan'}
          </p>
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = item.id === selectedItem?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectItem(item);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                    active
                      ? 'bg-rose-50 font-bold text-[#8B1515]'
                      : 'font-medium text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p>{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.subLabel}</p>
                  </div>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function MySalarySection({
  currentUser,
  dutyLogs,
  weekOptions,
  selectedWeekId,
  onSelectWeekId,
  targetJamSaya,
  menitMingguanSaya,
  officialPaySlips,
  onNotify,
}: MySalarySectionProps) {
  const [periodMode, setPeriodMode] = useState<'mingguan' | 'bulanan'>('mingguan');
  const [selectedDateYmd, setSelectedDateYmd] = useState<string>('2026-11-23');
  const [showDutyDetails, setShowDutyDetails] = useState<boolean>(false);
  const [detailFilterMode, setDetailFilterMode] = useState<'selected_date' | 'all_period'>(
    'selected_date'
  );
  const [activeSlipModal, setActiveSlipModal] = useState<OfficialPaySlipItem | null>(null);

  const selectedWeek = useMemo(
    () => weekOptions.find((w) => w.id === selectedWeekId) ?? weekOptions[0],
    [weekOptions, selectedWeekId]
  );

  const weeklyItems = useMemo<PeriodDropdownItem[]>(
    () =>
      weekOptions.map((w) => ({
        id: w.id,
        label: w.dropdownLabel,
        subLabel: w.badgeLabel,
        year: w.startDate.getFullYear(),
        monthIndex: w.startDate.getMonth(),
        weekRef: w,
      })),
    [weekOptions]
  );

  const monthlyItems = useMemo<PeriodDropdownItem[]>(() => {
    const anchor = weekOptions[0]?.startDate ?? new Date(2026, 10, 23);
    return Array.from({ length: 4 }, (_, idx) => {
      const target = new Date(anchor.getFullYear(), anchor.getMonth() - idx, 1);
      const y = target.getFullYear();
      const mIdx = target.getMonth();
      const monthName = `${BULAN_INDO[mIdx]} ${y}`;
      return {
        id: `month-${y}-${String(mIdx + 1).padStart(2, '0')}`,
        label: idx === 0 ? `${monthName} (Bulan Ini)` : monthName,
        subLabel: idx === 0 ? 'Bulan Berjalan' : 'Arsip Bulanan',
        year: y,
        monthIndex: mIdx,
      };
    });
  }, [weekOptions]);

  const [selectedMonthId, setSelectedMonthId] = useState<string>(
    () => monthlyItems[0]?.id ?? ''
  );

  const isMonthly = periodMode === 'bulanan';

  const activeDropdownItems = isMonthly ? monthlyItems : weeklyItems;
  const activeDropdownIndex = useMemo(() => {
    if (isMonthly) {
      const idx = monthlyItems.findIndex((m) => m.id === selectedMonthId);
      return idx >= 0 ? idx : 0;
    }
    const idx = weeklyItems.findIndex((w) => w.id === selectedWeek?.id);
    return idx >= 0 ? idx : 0;
  }, [isMonthly, monthlyItems, weeklyItems, selectedMonthId, selectedWeek?.id]);

  const activeSelectedItem = activeDropdownItems[activeDropdownIndex] ?? activeDropdownItems[0];

  const myDutyLogs = useMemo(
    () => dutyLogs.filter((l) => l.staffUid === currentUser.uid),
    [dutyLogs, currentUser.uid]
  );

  const activeDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const log of myDutyLogs) {
      const parsed = parseLogDate(log.waktuMulai);
      if (parsed) {
        set.add(toIsoDate(parsed));
      } else if (/^\d{4}-\d{2}-\d{2}/.test(log.waktuMulai)) {
        set.add(log.waktuMulai.slice(0, 10));
      }
    }
    return set;
  }, [myDutyLogs]);

  const periodDutyLogs = useMemo(() => {
    if (isMonthly) {
      const m = activeSelectedItem?.monthIndex ?? 10;
      const y = activeSelectedItem?.year ?? 2026;
      return myDutyLogs.filter((l) => {
        const d = parseLogDate(l.waktuMulai);
        return d ? d.getMonth() === m && d.getFullYear() === y : false;
      });
    }
    const w = activeSelectedItem?.weekRef ?? selectedWeek;
    if (!w) return myDutyLogs;
    return myDutyLogs.filter((l) => {
      const d = parseLogDate(l.waktuMulai);
      return d ? d >= w.startDate && d <= w.endDate : false;
    });
  }, [isMonthly, activeSelectedItem, selectedWeek, myDutyLogs]);

  const selectedDayLogs = useMemo(() => {
    return myDutyLogs.filter((l) => {
      const d = parseLogDate(l.waktuMulai);
      return d ? toIsoDate(d) === selectedDateYmd : l.waktuMulai.startsWith(selectedDateYmd);
    });
  }, [myDutyLogs, selectedDateYmd]);

  const menitHariTerpilih = useMemo(
    () => selectedDayLogs.reduce((acc, item) => acc + item.durasiMenit, 0),
    [selectedDayLogs]
  );

  const activeMinutes = isMonthly
    ? periodDutyLogs.reduce((acc, item) => acc + item.durasiMenit, 0)
    : menitMingguanSaya;
  const activeHours = activeMinutes / 60;
  const activeTargetHours = isMonthly ? targetJamSaya * 4 : targetJamSaya;

  const ratePerHour = 100000;
  const fullTargetSalary = Math.round(activeTargetHours * ratePerHour);
  const overtimeChunkMinutes = 30;
  const overtimeRatePerChunk = 15000;

  const isTargetMet = activeTargetHours > 0 && activeHours >= activeTargetHours;
  const progressPct =
    activeTargetHours > 0
      ? Math.min(100, Math.round((activeHours / activeTargetHours) * 100))
      : 0;

  const baseSalary = isTargetMet
    ? fullTargetSalary
    : Math.round(activeHours * ratePerHour);

  const excessMinutes = Math.max(0, Math.round(activeMinutes - activeTargetHours * 60));
  const overtimeChunks = Math.floor(excessMinutes / overtimeChunkMinutes);
  const overtimeBonus = overtimeChunks * overtimeRatePerChunk;
  const totalEstimatedSalary = baseSalary + overtimeBonus;

  const shortfallHours = Math.max(0, activeTargetHours - activeHours);
  const excessHours = Math.max(0, activeHours - activeTargetHours);

  const dailyTargetHours = useMemo(() => {
    const baseDaily = targetJamSaya > 0 ? targetJamSaya / 7 : 3;
    return Math.max(1, Number(baseDaily.toFixed(1)));
  }, [targetJamSaya]);

  const dailyProgressPct = Math.min(
    100,
    Math.round(((menitHariTerpilih / 60) / dailyTargetHours) * 100)
  );

  const userLevel = getUserLevelNumber(currentUser);
  const canStepPrev = activeDropdownIndex < activeDropdownItems.length - 1;
  const canStepNext = activeDropdownIndex > 0;

  const handleSelectDropdownItem = (item: PeriodDropdownItem) => {
    if (isMonthly) {
      setSelectedMonthId(item.id);
    } else {
      onSelectWeekId(item.id);
    }
  };

  const handleStepPeriod = (delta: number) => {
    const nextIdx = activeDropdownIndex + delta;
    if (nextIdx >= 0 && nextIdx < activeDropdownItems.length) {
      handleSelectDropdownItem(activeDropdownItems[nextIdx]);
    }
  };

  const handlePickDate = (ymd: string) => {
    if (!ymd) return;
    setSelectedDateYmd(ymd);
    const parsed = new Date(`${ymd}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      const matchedWeek = weekOptions.find((w) => {
        const endInclusive = new Date(w.endDate);
        endInclusive.setHours(23, 59, 59, 999);
        return parsed >= w.startDate && parsed <= endInclusive;
      });
      if (matchedWeek && matchedWeek.id !== selectedWeek?.id) {
        onSelectWeekId(matchedWeek.id);
      }
      const matchedMonth = monthlyItems.find(
        (m) => m.year === parsed.getFullYear() && m.monthIndex === parsed.getMonth()
      );
      if (matchedMonth) {
        setSelectedMonthId(matchedMonth.id);
      }
    }
  };

  const handleResetToday = () => {
    const todayYmd = toIsoDate(new Date());
    handlePickDate(todayYmd);
    if (weekOptions[0]) {
      onSelectWeekId(weekOptions[0].id);
    }
    if (monthlyItems[0]) {
      setSelectedMonthId(monthlyItems[0].id);
    }
  };

  const visibleDetailLogs =
    detailFilterMode === 'selected_date' ? selectedDayLogs : periodDutyLogs;

  const periodBadgeLabel = isMonthly
    ? `${BULAN_INDO[activeSelectedItem?.monthIndex ?? 10]} ${activeSelectedItem?.year ?? 2026}`
    : selectedWeek?.shortRange ?? '23 – 29 Nov 2026';

  const mySlips = useMemo(() => {
    const rawList = Array.isArray(officialPaySlips) ? officialPaySlips : [];
    const filtered = rawList.filter((s) => !s.staffUid || s.staffUid === currentUser.uid);
    const source = filtered.length > 0 ? filtered : rawList;
    return source.map((item, idx) => normalizeSlipItem(item, idx));
  }, [officialPaySlips, currentUser.uid]);

  const handlePrintSlip = () => {
    if (onNotify) {
      onNotify('Menyiapkan tampilan cetak slip gaji resmi...');
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#8B1515]">
                LEVEL {userLevel}
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {currentUser.role}
              </span>
            </div>
            <h2 className="mt-1.5 font-heading text-xl font-extrabold text-slate-900">
              Gaji Saya &amp; Estimasi {isMonthly ? 'Bulanan' : 'Mingguan'} Real-Time
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Sistem menghitung estimasi gaji dari log duty &amp; target jabatan · Di bawah target proporsional per jam, capai target gaji penuh + bonus lembur.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:shrink-0">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                TARGET DUTY
              </p>
              <p className="mt-0.5 font-heading text-xs font-extrabold text-slate-900">
                {activeTargetHours} Jam/{isMonthly ? 'Bln' : 'Mgg'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                GAJI UTUH
              </p>
              <p className="mt-0.5 font-heading text-xs font-extrabold text-slate-900">
                {formatRupiah(fullTargetSalary)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                PER JAM (&lt; TARGET)
              </p>
              <p className="mt-0.5 font-heading text-xs font-extrabold text-slate-900">
                {formatRupiah(ratePerHour)}/j
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                BONUS LEMBUR
              </p>
              <p className="mt-0.5 font-heading text-xs font-extrabold text-slate-900">
                +{formatRupiah(overtimeRatePerChunk)} / 30m
              </p>
            </div>
          </div>
        </div>

        {/* Custom Datepicker di kiri, Custom Dropdown Periode & Toggle Mingguan/Bulanan di kanan */}
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <CustomDailyDatePicker
              valueYmd={selectedDateYmd}
              onChangeYmd={handlePickDate}
              activeDatesSet={activeDatesSet}
            />

            <button
              type="button"
              onClick={handleResetToday}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#8B1515]"
              title="Kembali ke tanggal hari ini"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Hari Ini</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!canStepPrev}
                onClick={() => handleStepPeriod(1)}
                className="flex h-9 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Periode sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <CustomPeriodDropdown
                mode={periodMode}
                items={activeDropdownItems}
                selectedItem={activeSelectedItem}
                onSelectItem={handleSelectDropdownItem}
              />

              <button
                type="button"
                disabled={!canStepNext}
                onClick={() => handleStepPeriod(-1)}
                className="flex h-9 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Periode berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setPeriodMode('mingguan')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  periodMode === 'mingguan'
                    ? 'bg-[#8B1515] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setPeriodMode('bulanan')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  periodMode === 'bulanan'
                    ? 'bg-[#8B1515] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>
        </div>

        {/* Ringkasan Progress Harian pada Tanggal Terpilih */}
        <div className="mt-4 rounded-xl border border-rose-100/90 bg-rose-50/35 px-4 py-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-900">
                <Clock className="h-3.5 w-3.5 text-[#8B1515]" />
                Progress Harian ({formatTanggalIndo(selectedDateYmd)}):
              </span>
              <span className="font-mono font-extrabold text-[#8B1515]">
                {formatJamDesimal(menitHariTerpilih)}
              </span>
              <span className="text-slate-400">({menitHariTerpilih} menit)</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] font-semibold text-slate-600">
                {selectedDayLogs.length} sesi duty tercatat
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold text-slate-500">
                Target harian acuan: {dailyTargetHours} Jam ({dailyProgressPct}%)
              </span>
              <button
                type="button"
                onClick={() => {
                  setDetailFilterMode('selected_date');
                  setShowDutyDetails(true);
                }}
                className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-50"
              >
                Lihat Log Hari Ini
              </button>
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
            <div
              className="h-full rounded-full bg-[#8B1515] transition-all duration-300"
              style={{ width: `${dailyProgressPct}%` }}
            />
          </div>
        </div>

        {/* Status Jam Kerja Periode & Progress Bar Utama */}
        <div className="mt-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                STATUS JAM KERJA &amp; KALKULASI GAJI ({periodBadgeLabel})
              </p>
              <p className="mt-1 font-heading text-xl font-extrabold text-slate-900">
                {activeHours.toFixed(2)} Jam{' '}
                <span className="text-sm font-semibold text-slate-400">
                  / target {activeTargetHours} Jam
                </span>
              </p>
            </div>

            {isTargetMet ? (
              <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                Target Tercapai (Berhak Gaji Utuh Penuh)
              </span>
            ) : (
              <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
                Kurang {shortfallHours.toFixed(2)}j (Dihitung Per Jam × {formatRupiah(ratePerHour)})
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">
                Pencapaian Jam Duty {isMonthly ? 'Bulanan' : 'Mingguan'}
              </span>
              <span className="font-mono font-bold text-slate-700">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isTargetMet ? 'bg-emerald-500' : 'bg-[#8B1515]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Kartu Kalkulasi */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              STATUS PERHITUNGAN GAJI
            </p>
            <p className="mt-2 font-heading text-lg font-extrabold text-slate-900">
              {isTargetMet ? 'Gaji Utuh' : 'Gaji Per Jam'}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {isTargetMet
                ? 'Target periode terpenuhi'
                : `${activeHours.toFixed(2)}j × ${formatRupiah(ratePerHour)}`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              GAJI POKOK TERHITUNG
            </p>
            <p className="mt-2 font-heading text-lg font-extrabold text-slate-900">
              {formatRupiah(baseSalary)}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {isTargetMet ? `Skema utuh ${currentUser.role}` : 'Sesuai durasi duty'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              BONUS KELEBIHAN JAM ({overtimeChunks}×)
            </p>
            <p className="mt-2 font-heading text-lg font-extrabold text-slate-900">
              +{formatRupiah(overtimeBonus)}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {excessHours > 0
                ? `+${excessHours.toFixed(2)}j di atas target`
                : 'Tidak ada lembur'}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-[#8B1515] p-4 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-100">
              ESTIMASI TAKE HOME PAY
            </p>
            <p className="mt-2 font-heading text-lg font-extrabold text-white">
              {formatRupiah(totalEstimatedSalary)}
            </p>
            <p className="mt-1.5 text-[11px] text-rose-100/90">
              {periodBadgeLabel} (Belum potongan/tunjangan)
            </p>
          </div>
        </div>

        {/* Toggle Rincian Sesi Duty */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowDutyDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition hover:text-[#8B1515]"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showDutyDetails ? 'rotate-180 text-[#8B1515]' : ''
                }`}
              />
              <span>
                {showDutyDetails ? 'Sembunyikan' : 'Lihat'} Rincian Sesi Duty (
                {periodDutyLogs.length} Log Periode · {selectedDayLogs.length} Log Tgl{' '}
                {selectedDateYmd})
              </span>
            </button>

            {showDutyDetails && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDetailFilterMode('selected_date')}
                  className={`rounded-md px-2.5 py-1 font-bold transition ${
                    detailFilterMode === 'selected_date'
                      ? 'bg-white text-[#8B1515] shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Tanggal ({selectedDateYmd})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailFilterMode('all_period')}
                  className={`rounded-md px-2.5 py-1 font-bold transition ${
                    detailFilterMode === 'all_period'
                      ? 'bg-white text-[#8B1515] shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Semua Periode
                </button>
              </div>
            )}
          </div>

          {showDutyDetails && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="px-3.5 py-2.5 text-left">WAKTU MULAI</th>
                    <th className="px-3.5 py-2.5 text-left">WAKTU SELESAI</th>
                    <th className="px-3.5 py-2.5 text-left">PEKERJAAN / DIVISI</th>
                    <th className="px-3.5 py-2.5 text-center">DURASI MENIT</th>
                    <th className="px-3.5 py-2.5 text-center">FORMAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleDetailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                        Tidak ada log sesi duty pada filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    visibleDetailLogs.map((log, idx) => {
                      const rec = log as unknown as Record<string, unknown>;
                      const pekerjaan = String(
                        rec.pekerjaan ?? rec.divisi ?? currentUser.divisi ?? 'Medis'
                      );
                      return (
                        <tr key={log.id ?? `duty-row-${idx}`} className="hover:bg-slate-50/60">
                          <td className="px-3.5 py-2.5 text-left font-mono text-[11px] text-slate-700">
                            {log.waktuMulai}
                          </td>
                          <td className="px-3.5 py-2.5 text-left font-mono text-[11px] text-slate-700">
                            {log.waktuSelesai}
                          </td>
                          <td className="px-3.5 py-2.5 text-left font-semibold text-slate-800">
                            {pekerjaan}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-bold text-[#8B1515]">
                            {log.durasiMenit} min
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-[11px] text-slate-500">
                            {formatMenitKeFormatJam(log.durasiMenit)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Riwayat Slip Gaji Resmi */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            Riwayat Slip Gaji Resmi (Pay Slip)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Klik &ldquo;Lihat Slip&rdquo; untuk membuka rincian slip gaji resmi yang dapat dicetak.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3 text-center">PERIODE</th>
                <th className="py-3 px-3 text-center">TOTAL JAM DUTY</th>
                <th className="py-3 px-3 text-center">GAJI POKOK</th>
                <th className="py-3 px-3 text-center">BONUS &amp; TUNJANGAN</th>
                <th className="py-3 px-3 text-center">POTONGAN</th>
                <th className="py-3 px-3 text-center">TAKE HOME PAY</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mySlips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Belum ada riwayat slip gaji resmi yang diterbitkan.
                  </td>
                </tr>
              ) : (
                mySlips.map((slip) => {
                  const bonusTunjangan = slip.bonusDuty + slip.tunjanganTambahan;
                  return (
                    <tr key={slip.id} className="transition hover:bg-slate-50/60">
                      <td className="py-4 px-3 text-center font-bold text-slate-900">
                        {slip.periodeLabel}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-slate-700">
                        {slip.totalJamDuty.toFixed(2)} Jam
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-slate-800">
                        {formatRupiah(slip.gajiPokok)}
                      </td>
                      <td className="py-4 px-3 text-center font-semibold text-emerald-600">
                        +{formatRupiah(bonusTunjangan)}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-rose-500">
                        -{formatRupiah(Math.abs(slip.potongan))}
                      </td>
                      <td className="py-4 px-3 text-center font-extrabold text-[#8B1515]">
                        {formatRupiah(slip.takeHomePay)}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            slip.statusPembayaran === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {slip.statusPembayaran}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveSlipModal(slip)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-1.5 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-100/70"
                        >
                          Lihat Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {activeSlipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setActiveSlipModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-extrabold text-slate-900">
                    Slip Gaji Resmi · {activeSlipModal.periodeLabel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeSlipModal.namaStaff || formatStaffDisplayName(currentUser)} ·{' '}
                    {activeSlipModal.jabatan}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSlipModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup modal slip gaji"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Total Jam Duty</span>
                <span className="font-bold text-slate-800">
                  {activeSlipModal.totalJamDuty.toFixed(2)} Jam
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Gaji Pokok</span>
                <span className="font-bold text-slate-800">
                  {formatRupiah(activeSlipModal.gajiPokok)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Bonus Duty &amp; Tunjangan</span>
                <span className="font-bold text-emerald-600">
                  +{formatRupiah(activeSlipModal.bonusDuty + activeSlipModal.tunjanganTambahan)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Potongan</span>
                <span className="font-bold text-rose-500">
                  -{formatRupiah(Math.abs(activeSlipModal.potongan))}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="font-extrabold text-slate-900">Take Home Pay</span>
                <span className="font-heading font-extrabold text-[#8B1515]">
                  {formatRupiah(activeSlipModal.takeHomePay)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>Status: {activeSlipModal.statusPembayaran}</span>
                <span>Tanggal Bayar: {activeSlipModal.tanggalBayar}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setActiveSlipModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}