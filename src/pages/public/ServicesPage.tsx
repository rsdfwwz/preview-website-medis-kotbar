import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Ban,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  DollarSign,
  Eye,
  FileText,
  HeartHandshake,
  History,
  Info,
  Minus,
  Pill,
  Play,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  IshiharaTestModal,
  type IshiharaTestResultPayload,
} from '../../components/IshiharaTestModal';
import type { PsychologyEvaluationPayload } from '../../components/PsychologyEvaluationModal';
import { usePortal } from '../../context/PortalContext';
import type { ServiceType, StaffProfile } from '../../types';
import { formatKbrp, formatStaffDisplayName } from '../../utils/formatters';
import {
  appendLocalSubmissionRecord,
  updateLocalSubmissionStatus,
} from './SubmissionsHistoryPage';
import {
  appendLocalTestResultRecord,
  type StoredTestResultRecord,
} from './TestResultsPage';

interface SelectOptionItem {
  value: string;
  label: string;
  subtitle?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | SelectOptionItem)[];
  placeholder?: string;
  compact?: boolean;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  compact = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedOptions: SelectOptionItem[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${compact ? 'min-w-[195px]' : 'mt-1.5 w-full'}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2.5 rounded-xl border bg-white text-left transition ${
          compact ? 'px-3.5 py-2 text-xs font-semibold' : 'px-3.5 py-2.5 text-sm'
        } ${
          open
            ? 'border-[#8B1515] ring-2 ring-red-100'
            : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl ring-1 ring-slate-950/5">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                  compact ? 'text-xs' : 'text-[13px]'
                } ${
                  isSelected
                    ? 'bg-red-50 font-bold text-[#8B1515]'
                    : 'font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{opt.label}</p>
                  {opt.subtitle && (
                    <p className="mt-0.5 truncate text-[11px] font-normal text-slate-400">
                      {opt.subtitle}
                    </p>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-[#8B1515]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const BULAN_LABEL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARI_SINGKAT = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

function parseIsoDateParts(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return { year, month, day };
}

function toIsoDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatDisplayDateId(iso: string): string {
  const parsed = parseIsoDateParts(iso);
  if (!parsed) return '';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month + 1).padStart(2, '0');
  return `${dd}/${mm}/${parsed.year}`;
}

function calculateAgeFromBirthDate(birthDateStr: string): string {
  const trimmed = birthDateStr.trim();
  if (!trimmed) return '';

  let year = 0;
  let month = 0;
  let day = 0;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (dmyMatch) {
    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    year = Number(dmyMatch[3]);
  } else {
    return '';
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return '';

  const birthDate = new Date(year, month - 1, day);
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return '';
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }

  if (age < 0 || age > 150) return '';

  return String(age);
}

function sanitizeDigitsOnly(raw: string): string {
  return raw.replace(/\D+/g, '');
}

interface CustomDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

function CustomDatePicker({
  value,
  onChange,
  placeholder = '(DD/MM/YYYY)',
  minYear = 1940,
  maxYear = 2035,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const initialParsed = useMemo(() => {
    return parseIsoDateParts(value) ?? { year: 2026, month: 10, day: 24 };
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialParsed.year);
  const [viewMonth, setViewMonth] = useState<number>(initialParsed.month);

  useEffect(() => {
    if (open) {
      const p = parseIsoDateParts(value) ?? { year: 2026, month: 10, day: 24 };
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      month: number;
      year: number;
      inCurrentMonth: boolean;
      iso: string;
    }[] = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        day: d,
        month: prevM,
        year: prevY,
        inCurrentMonth: false,
        iso: toIsoDateString(prevY, prevM, d),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        inCurrentMonth: true,
        iso: toIsoDateString(viewYear, viewMonth, d),
      });
    }

    const remainder = cells.length % 7;
    const trailing = remainder === 0 ? 0 : 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        day: d,
        month: nextM,
        year: nextY,
        inCurrentMonth: false,
        iso: toIsoDateString(nextY, nextM, d),
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const stepMonth = (delta: number) => {
    let nextM = viewMonth + delta;
    let nextY = viewYear;
    if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    } else if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  };

  const formattedValue = formatDisplayDateId(value);

  return (
    <div ref={boxRef} className="relative mt-1.5 w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition ${
          open
            ? 'border-[#8B1515] ring-2 ring-red-100'
            : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <span className={formattedValue ? 'font-mono text-slate-900' : 'text-slate-400'}>
          {formattedValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-[#8B1515]" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-76 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl ring-1 ring-slate-950/5">
          <div className="flex items-center justify-between gap-2 pb-2.5">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
              <span>{BULAN_LABEL[viewMonth]}</span>
              <CustomSelect
                compact
                value={String(viewYear)}
                onChange={(val) => setViewYear(Number(val))}
                options={Array.from({ length: maxYear - minYear + 1 }, (_, idx) => {
                  const yr = minYear + idx;
                  return { value: String(yr), label: String(yr) };
                })}
              />
            </div>

            <button
              type="button"
              onClick={() => stepMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-400">
            {HARI_SINGKAT.map((h) => (
              <span key={h} className="py-1">
                {h}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
            {calendarCells.map((cell, idx) => {
              const isSelected = value === cell.iso;
              return (
                <button
                  key={`${cell.iso}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(cell.iso);
                    setOpen(false);
                  }}
                  className={`flex h-8 w-full items-center justify-center rounded-lg font-mono text-xs transition ${
                    isSelected
                      ? 'bg-[#8B1515] font-extrabold text-white'
                      : cell.inCurrentMonth
                        ? 'font-semibold text-slate-800 hover:bg-red-50 hover:text-[#8B1515]'
                        : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-slate-500 hover:text-slate-800"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const iso = toIsoDateString(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate()
                );
                onChange(iso);
                setOpen(false);
              }}
              className="text-[#8B1515] hover:underline"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PharmacyCatalogItem {
  id: string;
  kodeHuruf: string;
  nama: string;
  harga: number;
  deskripsi: string;
}

interface SidebarGuideInfo {
  judul: string;
  subjudul: string;
  estimasiBiaya: string;
  waktuProses: string;
  poinKetentuan: string[];
}

interface SubmittedReceiptSummary {
  ticket: string;
  jenisLayanan: string;
  namaWarga: string;
  citizenId: string;
  noHpIc: string;
  detailPermintaan: string;
  biayaKbrp: number;
  statusLabel: string;
}

function formatNowTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

type DraftableServiceKey = Exclude<ServiceType, 'Tes Buta Warna'>;

interface ServiceDraftSnapshot {
  updatedAt: string;
  data: Record<string, string | number | boolean>;
}

const DRAFT_STORAGE_PREFIX = 'rskbr_service_draft_v1:';

function getDraftStorageKey(tab: DraftableServiceKey): string {
  return `${DRAFT_STORAGE_PREFIX}${tab}`;
}

function readServiceDraft(tab: DraftableServiceKey): ServiceDraftSnapshot | null {
  try {
    const raw = localStorage.getItem(getDraftStorageKey(tab));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ServiceDraftSnapshot;
    if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeServiceDraft(
  tab: DraftableServiceKey,
  data: Record<string, string | number | boolean>
): void {
  try {
    localStorage.setItem(
      getDraftStorageKey(tab),
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        data,
      })
    );
  } catch {
    // Abaikan jika storage penuh atau diblokir
  }
}

function clearServiceDraft(tab: DraftableServiceKey): void {
  try {
    localStorage.removeItem(getDraftStorageKey(tab));
  } catch {
    // Abaikan
  }
}

function hasMeaningfulDraftData(
  tab: DraftableServiceKey,
  data: Record<string, string | number | boolean>
): boolean {
  const stringVal = (key: string) => String(data[key] ?? '').trim();

  switch (tab) {
    case 'Surat Kesehatan':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('tanggalLahir') ||
          stringVal('umur') ||
          stringVal('pekerjaan') ||
          stringVal('noHpIc') ||
          (data.keperluanSks && data.keperluanSks !== 'Pemeriksaan Rutin') ||
          (data.gender && data.gender !== 'Laki-laki')
      );
    case 'Janji Temu Poli':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('citizenId') ||
          stringVal('noHpIc') ||
          stringVal('keluhanPoli') ||
          stringVal('selectedDoctorUid')
      );
    case 'Operasi Plastik':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('tanggalLahir') ||
          stringVal('umur') ||
          stringVal('pekerjaan') ||
          stringVal('noHpIc') ||
          stringVal('fileKtpName') ||
          stringVal('fileSkckName') ||
          stringVal('fileKartuPasienName') ||
          (data.jenisOplas &&
            data.jenisOplas !== 'Rhinoplasty & Facial Contouring / Oplas ($75.000 KBRP)')
      );
    case 'Tes Psikologi':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('tanggalLahir') ||
          stringVal('umur') ||
          stringVal('pekerjaan') ||
          stringVal('citizenId') ||
          stringVal('noHpIc') ||
          stringVal('keluhanPsikologi') ||
          (data.keperluanPsikologi &&
            data.keperluanPsikologi !== 'Rekrutmen Kepolisian / Instansi') ||
          (data.gender && data.gender !== 'Laki-laki')
      );
    case 'Klaim Benefit SKWB':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('tanggalLahir') ||
          stringVal('fileSkwbName') ||
          (data.tanggalTerbitSkwb && data.tanggalTerbitSkwb !== '2026-11-24')
      );
    case 'Karakter Kill':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('tanggalLahir') ||
          stringVal('umur') ||
          stringVal('pekerjaan') ||
          stringVal('citizenId') ||
          stringVal('steamHex') ||
          stringVal('noHpIc') ||
          stringVal('penyebabKematian') ||
          stringVal('kronologiCk') ||
          Boolean(data.setujuPernyataanCk) ||
          (data.jenisPemakaman && data.jenisPemakaman !== 'Penguburan') ||
          (data.gender && data.gender !== 'Laki-laki')
      );
    case 'Loket Farmasi':
      return Boolean(
        stringVal('namaWarga') ||
          stringVal('noKantong') ||
          Number(data.jumlahPaket ?? 1) > 1 ||
          (data.paketFarmasiId && data.paketFarmasiId !== 'perban-10')
      );
    default:
      return false;
  }
}

interface PsychQuestionItem {
  id: string;
  code: string;
  prompt: string;
}

const GHQ12_QUESTIONS: PsychQuestionItem[] = [
  { id: 'ghq_1', code: 'GHQ-01', prompt: 'Mampu berkonsentrasi pada aktivitas atau tugas harian' },
  { id: 'ghq_2', code: 'GHQ-02', prompt: 'Kurang tidur karena rasa cemas atau pikiran yang mengganggu' },
  { id: 'ghq_3', code: 'GHQ-03', prompt: 'Merasa berperan dan berguna dalam keseharian' },
  { id: 'ghq_4', code: 'GHQ-04', prompt: 'Mampu mengambil keputusan atas masalah sehari-hari' },
  { id: 'ghq_5', code: 'GHQ-05', prompt: 'Merasa tertekan atau berada di bawah tekanan berat' },
  { id: 'ghq_6', code: 'GHQ-06', prompt: 'Merasa kesulitan mengatasi persoalan hidup' },
  { id: 'ghq_7', code: 'GHQ-07', prompt: 'Menikmati aktivitas rutin harian seperti biasa' },
  { id: 'ghq_8', code: 'GHQ-08', prompt: 'Mampu menghadapi masalah yang datang secara proporsional' },
  { id: 'ghq_9', code: 'GHQ-09', prompt: 'Merasa tidak bahagia atau murung' },
  { id: 'ghq_10', code: 'GHQ-10', prompt: 'Kehilangan rasa percaya diri terhadap diri sendiri' },
  { id: 'ghq_11', code: 'GHQ-11', prompt: 'Menganggap diri sebagai individu yang tidak berharga' },
  { id: 'ghq_12', code: 'GHQ-12', prompt: 'Merasa cukup bahagia dan tenang secara keseluruhan' },
];

const DASS21_QUESTIONS: {
  id: string;
  code: string;
  domain: 'stres' | 'kecemasan' | 'depresi';
  domainLabel: string;
  prompt: string;
}[] = [
  { id: 'dass_1', code: 'DASS-01', domain: 'stres', domainLabel: 'Stres', prompt: 'Sulit beristirahat atau menenangkan diri' },
  { id: 'dass_2', code: 'DASS-02', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Mulut terasa kering tanpa sebab fisik yang jelas' },
  { id: 'dass_3', code: 'DASS-03', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Sulit merasakan emosi positif sama sekali' },
  { id: 'dass_4', code: 'DASS-04', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Mengalami sesak napas atau napas terasa berat' },
  { id: 'dass_5', code: 'DASS-05', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Sulit berinisiatif melakukan sesuatu' },
  { id: 'dass_6', code: 'DASS-06', domain: 'stres', domainLabel: 'Stres', prompt: 'Cenderung bereaksi berlebihan terhadap situasi tertentu' },
  { id: 'dass_7', code: 'DASS-07', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Merasa gemetar (misalnya pada tangan)' },
  { id: 'dass_8', code: 'DASS-08', domain: 'stres', domainLabel: 'Stres', prompt: 'Menghabiskan banyak energi untuk merasa cemas' },
  { id: 'dass_9', code: 'DASS-09', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Khawatir akan situasi di mana bisa panik dan mempermalukan diri' },
  { id: 'dass_10', code: 'DASS-10', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Merasa tidak ada hal yang dapat diharapkan ke depan' },
  { id: 'dass_11', code: 'DASS-11', domain: 'stres', domainLabel: 'Stres', prompt: 'Mudah merasa gelisah atau resah' },
  { id: 'dass_12', code: 'DASS-12', domain: 'stres', domainLabel: 'Stres', prompt: 'Sulit untuk rileks' },
  { id: 'dass_13', code: 'DASS-13', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Merasa sedih dan tertekan' },
  { id: 'dass_14', code: 'DASS-14', domain: 'stres', domainLabel: 'Stres', prompt: 'Tidak sabar saat menghadapi hal yang menghambat kegiatan' },
  { id: 'dass_15', code: 'DASS-15', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Merasa mendekati keadaan panik' },
  { id: 'dass_16', code: 'DASS-16', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Tidak mampu merasa antusias terhadap apa pun' },
  { id: 'dass_17', code: 'DASS-17', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Merasa kurang berharga sebagai pribadi' },
  { id: 'dass_18', code: 'DASS-18', domain: 'stres', domainLabel: 'Stres', prompt: 'Merasa mudah tersinggung atau sensitif' },
  { id: 'dass_19', code: 'DASS-19', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Menyadari detak jantung meningkat tanpa aktivitas fisik berat' },
  { id: 'dass_20', code: 'DASS-20', domain: 'kecemasan', domainLabel: 'Kecemasan', prompt: 'Merasa takut tanpa alasan yang jelas' },
  { id: 'dass_21', code: 'DASS-21', domain: 'depresi', domainLabel: 'Depresi', prompt: 'Merasa hidup tidak berarti' },
];

const SCALE_OPTIONS: { value: number; short: string; label: string }[] = [
  { value: 0, short: '0', label: 'Tidak Pernah' },
  { value: 1, short: '1', label: 'Jarang' },
  { value: 2, short: '2', label: 'Kadang-kadang' },
  { value: 3, short: '3', label: 'Sering / Hampir Selalu' },
];

type PsychWizardStep =
  | 'identity'
  | 'ghq_1'
  | 'ghq_2'
  | 'dass_1'
  | 'dass_2'
  | 'dass_3'
  | 'summary';

const PSYCH_WIZARD_ORDER: PsychWizardStep[] = [
  'identity',
  'ghq_1',
  'ghq_2',
  'dass_1',
  'dass_2',
  'dass_3',
  'summary',
];

function classifyGhq12(score: number): string {
  if (score <= 11) return 'Normal / Sehat Psikologis';
  if (score <= 15) return 'Terdapat indikasi distres ringan.';
  if (score <= 22) return 'Terdapat indikasi distres emosional sedang.';
  return 'Perlu evaluasi psikologis lanjutan.';
}

function classifyDassDomain(domain: 'stres' | 'kecemasan' | 'depresi', score: number): string {
  if (domain === 'depresi') {
    if (score <= 9) return 'Normal';
    if (score <= 13) return 'Ringan';
    if (score <= 20) return 'Sedang';
    if (score <= 27) return 'Parah';
    return 'Sangat Parah';
  }
  if (domain === 'kecemasan') {
    if (score <= 7) return 'Normal';
    if (score <= 9) return 'Ringan';
    if (score <= 14) return 'Sedang';
    if (score <= 19) return 'Parah';
    return 'Sangat Parah';
  }
  if (score <= 14) return 'Normal';
  if (score <= 18) return 'Ringan';
  if (score <= 25) return 'Sedang';
  if (score <= 33) return 'Parah';
  return 'Sangat Parah';
}

const PHARMACY_ITEMS: PharmacyCatalogItem[] = [
  {
    id: 'perban-10',
    kodeHuruf: 'a',
    nama: 'Paket Perban (10 Pcs)',
    harga: 20000,
    deskripsi: 'Perban medis steril standar penanganan luka ringan hingga sedang.',
  },
  {
    id: 'antidepresan-5',
    kodeHuruf: 'b',
    nama: 'Paket Obat Antidepresan',
    harga: 20000,
    deskripsi: 'Obat penenang stres & pemulihan kondisi psikologis warga (5 Pcs).',
  },
  {
    id: 'bundle-pengobatan',
    kodeHuruf: 'c',
    nama: 'Paket Pengobatan',
    harga: 40000,
    deskripsi:
      'Paket hemat kombinasi perawatan luka fisik (10 Perban) & stabilisasi stres (5 Antidepresan).',
  },
  {
    id: 'bundle-penyembuhan',
    kodeHuruf: 'd',
    nama: 'Paket Penyembuhan',
    harga: 45000,
    deskripsi:
      'Paket lengkap pemulihan intensif (15 Perban, 5 Antidepresan) untuk aktivitas luar kota.',
  },
];

const PLASTIC_SURGERY_OPTIONS = [
  {
    value: 'Rhinoplasty & Facial Contouring / Oplas ($75.000 KBRP)',
    label: 'Rhinoplasty & Facial Contouring / Oplas ($75.000 KBRP)',
    subtitle: 'Prosedur estetika wajah & kontur hidung standar',
    price: 75000,
  },
  {
    value: 'Full Facial & Body Reconstruction ($100.000 KBRP)',
    label: 'Full Facial & Body Reconstruction ($100.000 KBRP)',
    subtitle: 'Rekonstruksi penuh identitas wajah dan postur tubuh',
    price: 100000,
  },
  {
    value: 'Voucher Gratis 1x Operasi Plastik SKWB ($0 KBRP)',
    label: 'Voucher Gratis 1x Operasi Plastik SKWB ($0 KBRP)',
    subtitle: 'Khusus warga baru dengan lampiran SKWB aktif ≤ 7 hari',
    price: 0,
  },
];

const SERVICE_SIDEBAR_INFO: Record<Exclude<ServiceType, 'Loket Farmasi'>, SidebarGuideInfo> = {
  'Surat Kesehatan': {
    judul: 'Ketentuan Surat Keterangan Sehat',
    subjudul: 'Syarat & prosedur penerbitan SKS resmi RS Kota Baru.',
    estimasiBiaya: '$15.000 KBRP',
    waktuProses: '± 5 – 10 Menit Pemeriksaan Fisik',
    poinKetentuan: [
      'Wajib datang ke Pillbox Medical Center (Koordinat 201) setelah mengajukan tiket.',
      'Membawa kartu identitas resmi warga (Citizen ID) yang masih berlaku.',
      'Surat Keterangan Sehat dilengkapi nomor registrasi & verifikasi instansi.',
      'Masa berlaku sertifikat SKS adalah 14 hari kalender sejak tanggal diterbitkan.',
    ],
  },
  'Janji Temu Poli': {
    judul: 'Panduan Janji Temu Poli & Dokter',
    subjudul: 'Alur konsultasi dokter jaga maupun dokter spesialis.',
    estimasiBiaya: '$15.000 KBRP',
    waktuProses: 'Sesuai Jadwal Shift Dokter',
    poinKetentuan: [
      'Dokter yang Anda pilih akan langsung menerima panggilan otomatis melalui Bot Discord.',
      'Harap hadir di lobi Poli Umum Pillbox minimal 5 menit sebelum sesi konsultasi.',
      'Jelaskan keluhan medis secara rinci agar dokter dapat menyiapkan tindakan lanjutan.',
    ],
  },
  'Operasi Plastik': {
    judul: 'Prosedur Operasi Plastik & Estetika',
    subjudul: 'Ketentuan bedah rekonstruksi wajah dan tubuh.',
    estimasiBiaya: '$75.000 KBRP (Gratis 1x SKWB)',
    waktuProses: '± 15 – 20 Menit Ruang Bedah',
    poinKetentuan: [
      'Tindakan hanya dapat dilakukan oleh Doctor Specialist Bedah Plastik atau jajaran Direksi.',
      'Warga baru dengan status SKWB aktif (maksimal 7 hari) berhak mendapat 1x layanan gratis.',
      'Pasien wajib melampirkan KTP, Kartu Pasien, serta SKCK Kepolisian atau SKWB aktif.',
    ],
  },
  'Tes Buta Warna': {
    judul: 'Standar Diagnostik Tes Ishihara',
    subjudul: 'Informasi pengujian penglihatan warna 20 lempeng mandiri.',
    estimasiBiaya: 'GRATIS (Tanpa Biaya)',
    waktuProses: '± 3 – 5 Menit Ujian Mandiri',
    poinKetentuan: [
      'Layanan tes buta warna dapat dikerjakan langsung secara gratis melalui portal ini.',
      'Pengujian menggunakan metode 20 Lempeng Ishihara berstandar klinis internasional.',
      'Hasil tes tampil lengkap; sertifikat terbit setelah di-ACC oleh staf rumah sakit.',
    ],
  },
  'Tes Psikologi': {
    judul: 'Ketentuan Tes Psikologi & Mental',
    subjudul: 'Evaluasi kelayakan mental instansi & kepemilikan lisensi.',
    estimasiBiaya: '$25.000 KBRP',
    waktuProses: 'Hasil Tampil Setelah Tes · Sertifikat Menunggu ACC Staf',
    poinKetentuan: [
      'Tes Psikologi tidak masuk antrean pengajuan layanan, melainkan langsung menampilkan hasil lengkap.',
      'Menggunakan instrumen skrining GHQ-12 dan DASS-21 (Depresi, Kecemasan, Stres).',
      'Sertifikat (.JPEG) terbit dan dapat diunduh setelah hasil disetujui oleh staf di Dashboard Staff.',
    ],
  },
  'Klaim Benefit SKWB': {
    judul: 'Hak Fasilitas Warga Baru (SKWB)',
    subjudul: 'Rincian benefit gratis selama 7 hari pertama di Kota Baru.',
    estimasiBiaya: 'GRATIS (Tanpa Biaya)',
    waktuProses: 'Langsung Aktif Setelah Verifikasi',
    poinKetentuan: [
      'Gratis 1x tindakan Operasi Plastik & Rekonstruksi Estetika.',
      'Diskon 50% untuk seluruh biaya perawatan & penanganan medis di rumah sakit.',
      'Gratis 1x klaim Paket Perban medis di loket farmasi Pillbox.',
      'Hanya berlaku bagi warga dengan usia kependudukan maksimal 7 hari.',
    ],
  },
  'Karakter Kill': {
    judul: 'Administrasi Forensik & Pemakaman',
    subjudul: 'Prosedur pencatatan resmi Character Kill (CK) warga.',
    estimasiBiaya: '$50.000 KBRP',
    waktuProses: '± 15 Menit Pencatatan Forensik',
    poinKetentuan: [
      'Wajib menyertakan kronologi kejadian serta persetujuan pihak terkait sesuai aturan kota.',
      'Tim forensik akan menerbitkan akta kematian resmi dan menghapus rekam medis lama.',
      'Tersedia pilihan prosesi pemakaman umum maupun kremasi resmi RS Kota Baru.',
    ],
  },
};

const SERVICE_TABS: {
  id: ServiceType;
  num: string;
  shortLabel: string;
  icon: React.ElementType;
}[] = [
  { id: 'Surat Kesehatan', num: '01', shortLabel: 'Surat Kesehatan', icon: FileText },
  { id: 'Janji Temu Poli', num: '02', shortLabel: 'Poli & Janji Temu', icon: Stethoscope },
  { id: 'Operasi Plastik', num: '03', shortLabel: 'Operasi Plastik', icon: Sparkles },
  { id: 'Tes Buta Warna', num: '04', shortLabel: 'Tes Buta Warna', icon: Eye },
  { id: 'Tes Psikologi', num: '05', shortLabel: 'Tes Psikologi', icon: Brain },
  { id: 'Klaim Benefit SKWB', num: '06', shortLabel: 'Klaim SKWB', icon: ShieldCheck },
  { id: 'Karakter Kill', num: '07', shortLabel: 'Karakter Kill (CK)', icon: HeartHandshake },
  { id: 'Loket Farmasi', num: '08', shortLabel: 'Loket Farmasi', icon: Pill },
];

export function ServicesPage() {
  const portal = usePortal();
  const staffList = Array.isArray(portal?.staffList) ? portal.staffList : [];
  const submitCitizenService = portal?.submitCitizenService;

  const [searchParams, setSearchParams] = useSearchParams();
  const topAnchorRef = useRef<HTMLDivElement | null>(null);

  const tabParam = searchParams.get('tab') as ServiceType | null;
  const [activeTab, setActiveTab] = useState<ServiceType>(
    tabParam && SERVICE_TABS.some((t) => t.id === tabParam) ? tabParam : 'Surat Kesehatan'
  );

  useEffect(() => {
    if (tabParam && SERVICE_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Field Identitas Umum
  const [namaWarga, setNamaWarga] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [umur, setUmur] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [steamHex, setSteamHex] = useState('');
  const [noHpIc, setNoHpIc] = useState('');
  const [noKantong, setNoKantong] = useState('');

  // Field Form 01: SKS
  const [keperluanSks, setKeperluanSks] = useState('Pemeriksaan Rutin');

  // Field Form 02: Janji Temu Poli & Pemilihan Dokter Inline
  const [isDoctorPickerOpen, setIsDoctorPickerOpen] = useState(false);
  const [filterDivisiDokter, setFilterDivisiDokter] = useState('Semua Spesialisasi');
  const [selectedDoctor, setSelectedDoctor] = useState<StaffProfile | null>(null);
  const [keluhanPoli, setKeluhanPoli] = useState('');

  // Field Form 03: Operasi Plastik
  const [jenisOplas, setJenisOplas] = useState(PLASTIC_SURGERY_OPTIONS[0].value);
  const [fileKtpName, setFileKtpName] = useState('');
  const [fileSkckName, setFileSkckName] = useState('');
  const [fileKartuPasienName, setFileKartuPasienName] = useState('');

  // Field Form 04: Tes Buta Warna (Langsung di Website, Gratis, Menunggu ACC Staf untuk Sertifikat)
  const [isIshiharaModalOpen, setIsIshiharaModalOpen] = useState(false);
  const [ishiharaResult, setIshiharaResult] = useState<IshiharaTestResultPayload | null>(null);
  const [lastIshiharaRecordId, setLastIshiharaRecordId] = useState<string | null>(null);

  // Field Form 05: Psikologi (Wizard Bertahap, Hasil Lengkap Rata Tengah, Sertifikat Menunggu ACC Staf)
  const [keperluanPsikologi, setKeperluanPsikologi] = useState('Rekrutmen Kepolisian / Instansi');
  const [keluhanPsikologi, setKeluhanPsikologi] = useState('');
  const [psychStep, setPsychStep] = useState<PsychWizardStep>('identity');
  const [ghqAnswers, setGhqAnswers] = useState<Record<string, number>>({});
  const [dassAnswers, setDassAnswers] = useState<Record<string, number>>({});
  const [completedPsychRecord, setCompletedPsychRecord] = useState<StoredTestResultRecord | null>(
    null
  );

  // Field Form 06: Klaim SKWB
  const [tanggalTerbitSkwb, setTanggalTerbitSkwb] = useState('2026-11-24');
  const [fileSkwbName, setFileSkwbName] = useState('');

  // Field Form 07: Karakter Kill
  const [penyebabKematian, setPenyebabKematian] = useState('');
  const [kronologiCk, setKronologiCk] = useState('');
  const [jenisPemakaman, setJenisPemakaman] = useState('Penguburan');
  const [setujuPernyataanCk, setSetujuPernyataanCk] = useState(false);

  // Field Form 08: Loket Farmasi
  const [paketFarmasiId, setPaketFarmasiId] = useState('perban-10');
  const [jumlahPaket, setJumlahPaket] = useState(1);

  // Bukti pencatatan setelah submit (khusus layanan pengajuan reguler)
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmittedReceiptSummary | null>(null);
  const [confirmCancelReceipt, setConfirmCancelReceipt] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // State Modal Pop-up Konfirmasi Melanjutkan Pengisian Draf
  const [pendingDraft, setPendingDraft] = useState<{
    tab: DraftableServiceKey;
    snapshot: ServiceDraftSnapshot;
  } | null>(null);
  const isHydratingRef = useRef(false);
  const evaluatedTabRef = useRef<string | null>(null);

  const handleBirthDateChange = (nextBirthDate: string) => {
    setTanggalLahir(nextBirthDate);
    const computedAge = calculateAgeFromBirthDate(nextBirthDate);
    if (computedAge !== '') {
      setUmur(computedAge);
    }
  };

  const activeDoctors = staffList.filter(
    (s) =>
      s?.statusAkun === 'aktif' &&
      ['Director', 'Deputy Director', 'Doctor Specialist', 'Doctor'].includes(s.role)
  );

  const filteredDoctors =
    filterDivisiDokter === 'Semua Spesialisasi'
      ? activeDoctors
      : activeDoctors.filter((d) => d.divisi === filterDivisiDokter);

  const isIdentityReadyForPsychTest = Boolean(
    namaWarga.trim() &&
      tanggalLahir.trim() &&
      umur.trim() &&
      gender.trim() &&
      citizenId.trim() &&
      pekerjaan.trim() &&
      noHpIc.trim() &&
      keperluanPsikologi.trim()
  );

  const isGhqComplete = GHQ12_QUESTIONS.every((q) => typeof ghqAnswers[q.id] === 'number');
  const isDassComplete = DASS21_QUESTIONS.every((q) => typeof dassAnswers[q.id] === 'number');
  const isPsychQuizComplete = isGhqComplete && isDassComplete;

  const psychEvaluation = useMemo<PsychologyEvaluationPayload | null>(() => {
    if (!isPsychQuizComplete) return null;

    const ghqScore = GHQ12_QUESTIONS.reduce((acc, q) => acc + (ghqAnswers[q.id] ?? 0), 0);
    const ghqKategori = classifyGhq12(ghqScore);

    const rawStress = DASS21_QUESTIONS.filter((q) => q.domain === 'stres').reduce(
      (acc, q) => acc + (dassAnswers[q.id] ?? 0),
      0
    );
    const rawAnxiety = DASS21_QUESTIONS.filter((q) => q.domain === 'kecemasan').reduce(
      (acc, q) => acc + (dassAnswers[q.id] ?? 0),
      0
    );
    const rawDepression = DASS21_QUESTIONS.filter((q) => q.domain === 'depresi').reduce(
      (acc, q) => acc + (dassAnswers[q.id] ?? 0),
      0
    );

    const dassStresScore = rawStress * 2;
    const dassKecemasanScore = rawAnxiety * 2;
    const dassDepresiScore = rawDepression * 2;

    const dassStresKategori = classifyDassDomain('stres', dassStresScore);
    const dassKecemasanKategori = classifyDassDomain('kecemasan', dassKecemasanScore);
    const dassDepresiKategori = classifyDassDomain('depresi', dassDepresiScore);

    const summaryText = `Tujuan: ${keperluanPsikologi} | GHQ-12: ${ghqScore}/36 (${ghqKategori}) | DASS-21 -> D:${dassDepresiScore} (${dassDepresiKategori}), K:${dassKecemasanScore} (${dassKecemasanKategori}), S:${dassStresScore} (${dassStresKategori})${keluhanPsikologi.trim() ? ` | Keluhan: ${keluhanPsikologi.trim()}` : ''}`;

    return {
      namaPeserta: namaWarga.trim(),
      tanggalLahir,
      umur,
      gender,
      citizenId: citizenId.trim().toUpperCase(),
      pekerjaan,
      noHpIc: noHpIc.trim(),
      tujuanPemeriksaan: keperluanPsikologi,
      keluhanSingkat: keluhanPsikologi.trim(),
      ghqScore,
      ghqKategori,
      dassStresScore,
      dassStresKategori,
      dassKecemasanScore,
      dassKecemasanKategori,
      dassDepresiScore,
      dassDepresiKategori,
      summaryText,
    };
  }, [
    isPsychQuizComplete,
    ghqAnswers,
    dassAnswers,
    keperluanPsikologi,
    keluhanPsikologi,
    namaWarga,
    tanggalLahir,
    umur,
    gender,
    citizenId,
    pekerjaan,
    noHpIc,
  ]);

  const areQuestionsAnswered = (list: { id: string }[], map: Record<string, number>) =>
    list.every((item) => typeof map[item.id] === 'number');

  const handleNextPsychStep = () => {
    setFormError(null);

    if (psychStep === 'identity') {
      if (!isIdentityReadyForPsychTest) {
        setFormError(
          'Lengkapi seluruh data diri wajib (Nama Lengkap, Tanggal Lahir, Umur, Gender, Citizen ID, Pekerjaan, Nomor HP/IC, dan Tujuan Evaluasi Psikologi) untuk memulai tes.'
        );
        return;
      }
      setPsychStep('ghq_1');
      return;
    }

    if (psychStep === 'ghq_1') {
      if (!areQuestionsAnswered(GHQ12_QUESTIONS.slice(0, 6), ghqAnswers)) {
        setFormError('Jawab seluruh soal GHQ-12 nomor 1–6 terlebih dahulu.');
        return;
      }
      setPsychStep('ghq_2');
      return;
    }

    if (psychStep === 'ghq_2') {
      if (!areQuestionsAnswered(GHQ12_QUESTIONS.slice(6, 12), ghqAnswers)) {
        setFormError('Jawab seluruh soal GHQ-12 nomor 7–12 terlebih dahulu.');
        return;
      }
      setPsychStep('dass_1');
      return;
    }

    if (psychStep === 'dass_1') {
      if (!areQuestionsAnswered(DASS21_QUESTIONS.slice(0, 7), dassAnswers)) {
        setFormError('Jawab seluruh soal DASS-21 nomor 1–7 terlebih dahulu.');
        return;
      }
      setPsychStep('dass_2');
      return;
    }

    if (psychStep === 'dass_2') {
      if (!areQuestionsAnswered(DASS21_QUESTIONS.slice(7, 14), dassAnswers)) {
        setFormError('Jawab seluruh soal DASS-21 nomor 8–14 terlebih dahulu.');
        return;
      }
      setPsychStep('dass_3');
      return;
    }

    if (psychStep === 'dass_3') {
      if (!areQuestionsAnswered(DASS21_QUESTIONS.slice(14, 21), dassAnswers)) {
        setFormError('Jawab seluruh soal DASS-21 nomor 15–21 terlebih dahulu.');
        return;
      }
      setPsychStep('summary');
    }
  };

  const handlePrevPsychStep = () => {
    setFormError(null);
    const idx = PSYCH_WIZARD_ORDER.indexOf(psychStep);
    if (idx > 0) {
      setPsychStep(PSYCH_WIZARD_ORDER[idx - 1]);
    }
  };

  const resetAllFormFields = () => {
    setNamaWarga('');
    setTanggalLahir('');
    setGender('Laki-laki');
    setUmur('');
    setPekerjaan('');
    setCitizenId('');
    setSteamHex('');
    setNoHpIc('');
    setNoKantong('');
    setKeperluanSks('Pemeriksaan Rutin');
    setSelectedDoctor(null);
    setIsDoctorPickerOpen(false);
    setKeluhanPoli('');
    setJenisOplas(PLASTIC_SURGERY_OPTIONS[0].value);
    setFileKtpName('');
    setFileSkckName('');
    setFileKartuPasienName('');
    setKeperluanPsikologi('Rekrutmen Kepolisian / Instansi');
    setKeluhanPsikologi('');
    setPsychStep('identity');
    setGhqAnswers({});
    setDassAnswers({});
    setTanggalTerbitSkwb('2026-11-24');
    setFileSkwbName('');
    setPenyebabKematian('');
    setKronologiCk('');
    setJenisPemakaman('Penguburan');
    setSetujuPernyataanCk(false);
    setPaketFarmasiId('perban-10');
    setJumlahPaket(1);
    setFormError(null);
  };

  const getCurrentTabDraftPayload = (
    tab: DraftableServiceKey
  ): Record<string, string | number | boolean> => {
    switch (tab) {
      case 'Surat Kesehatan':
        return {
          namaWarga,
          tanggalLahir,
          gender,
          umur,
          pekerjaan,
          noHpIc,
          keperluanSks,
        };
      case 'Janji Temu Poli':
        return {
          namaWarga,
          citizenId,
          noHpIc,
          selectedDoctorUid: selectedDoctor?.uid ?? '',
          keluhanPoli,
        };
      case 'Operasi Plastik':
        return {
          namaWarga,
          tanggalLahir,
          gender,
          umur,
          pekerjaan,
          noHpIc,
          jenisOplas,
          fileKtpName,
          fileSkckName,
          fileKartuPasienName,
        };
      case 'Tes Psikologi':
        return {
          namaWarga,
          tanggalLahir,
          gender,
          umur,
          pekerjaan,
          citizenId,
          noHpIc,
          keperluanPsikologi,
          keluhanPsikologi,
        };
      case 'Klaim Benefit SKWB':
        return {
          namaWarga,
          tanggalLahir,
          tanggalTerbitSkwb,
          fileSkwbName,
        };
      case 'Karakter Kill':
        return {
          namaWarga,
          tanggalLahir,
          gender,
          umur,
          pekerjaan,
          citizenId,
          steamHex,
          noHpIc,
          penyebabKematian,
          kronologiCk,
          jenisPemakaman,
          setujuPernyataanCk,
        };
      case 'Loket Farmasi':
        return {
          namaWarga,
          noKantong,
          paketFarmasiId,
          jumlahPaket,
        };
    }
  };

  const applyDraftDataToState = (
    tab: DraftableServiceKey,
    data: Record<string, string | number | boolean>
  ) => {
    isHydratingRef.current = true;
    resetAllFormFields();

    const draftBirthDate = typeof data.tanggalLahir === 'string' ? data.tanggalLahir : '';
    if (typeof data.namaWarga === 'string') setNamaWarga(data.namaWarga);
    if (draftBirthDate) setTanggalLahir(draftBirthDate);
    if (typeof data.gender === 'string') setGender(data.gender);
    if (typeof data.umur === 'string' && data.umur.trim()) {
      setUmur(data.umur);
    } else if (draftBirthDate) {
      const computed = calculateAgeFromBirthDate(draftBirthDate);
      if (computed !== '') setUmur(computed);
    }
    if (typeof data.pekerjaan === 'string') setPekerjaan(data.pekerjaan);
    if (typeof data.citizenId === 'string') setCitizenId(data.citizenId);
    if (typeof data.steamHex === 'string') setSteamHex(data.steamHex);
    if (typeof data.noHpIc === 'string') setNoHpIc(sanitizeDigitsOnly(data.noHpIc));
    if (typeof data.noKantong === 'string') setNoKantong(data.noKantong);

    if (tab === 'Surat Kesehatan' && typeof data.keperluanSks === 'string') {
      setKeperluanSks(data.keperluanSks);
    }
    if (tab === 'Janji Temu Poli') {
      if (typeof data.keluhanPoli === 'string') setKeluhanPoli(data.keluhanPoli);
      if (typeof data.selectedDoctorUid === 'string' && data.selectedDoctorUid) {
        const foundDoc = staffList.find((s) => s.uid === data.selectedDoctorUid) ?? null;
        setSelectedDoctor(foundDoc);
      }
    }
    if (tab === 'Operasi Plastik') {
      if (typeof data.jenisOplas === 'string') setJenisOplas(data.jenisOplas);
      if (typeof data.fileKtpName === 'string') setFileKtpName(data.fileKtpName);
      if (typeof data.fileSkckName === 'string') setFileSkckName(data.fileSkckName);
      if (typeof data.fileKartuPasienName === 'string') {
        setFileKartuPasienName(data.fileKartuPasienName);
      }
    }
    if (tab === 'Tes Psikologi') {
      if (typeof data.keperluanPsikologi === 'string') {
        setKeperluanPsikologi(data.keperluanPsikologi);
      }
      if (typeof data.keluhanPsikologi === 'string') {
        setKeluhanPsikologi(data.keluhanPsikologi);
      }
    }
    if (tab === 'Klaim Benefit SKWB') {
      if (typeof data.tanggalTerbitSkwb === 'string') {
        setTanggalTerbitSkwb(data.tanggalTerbitSkwb);
      }
      if (typeof data.fileSkwbName === 'string') setFileSkwbName(data.fileSkwbName);
    }
    if (tab === 'Karakter Kill') {
      if (typeof data.penyebabKematian === 'string') {
        setPenyebabKematian(data.penyebabKematian);
      }
      if (typeof data.kronologiCk === 'string') setKronologiCk(data.kronologiCk);
      if (typeof data.jenisPemakaman === 'string') setJenisPemakaman(data.jenisPemakaman);
      if (typeof data.setujuPernyataanCk === 'boolean') {
        setSetujuPernyataanCk(data.setujuPernyataanCk);
      }
    }
    if (tab === 'Loket Farmasi') {
      if (typeof data.paketFarmasiId === 'string') setPaketFarmasiId(data.paketFarmasiId);
      if (typeof data.jumlahPaket === 'number') {
        setJumlahPaket(Math.min(3, Math.max(1, data.jumlahPaket)));
      }
    }

    setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  };

  useEffect(() => {
    if (activeTab === 'Tes Buta Warna') {
      setPendingDraft(null);
      return;
    }

    const draftKey = `${activeTab}`;
    if (evaluatedTabRef.current === draftKey) return;
    evaluatedTabRef.current = draftKey;

    const existing = readServiceDraft(activeTab);
    if (existing && hasMeaningfulDraftData(activeTab, existing.data)) {
      isHydratingRef.current = true;
      resetAllFormFields();
      setPendingDraft({ tab: activeTab, snapshot: existing });
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);
    } else {
      setPendingDraft(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, staffList.length]);

  useEffect(() => {
    if (activeTab === 'Tes Buta Warna') return;
    if (isHydratingRef.current) return;
    if (pendingDraft && pendingDraft.tab === activeTab) return;

    const payload = getCurrentTabDraftPayload(activeTab);
    if (hasMeaningfulDraftData(activeTab, payload)) {
      writeServiceDraft(activeTab, payload);
    } else {
      clearServiceDraft(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    pendingDraft,
    namaWarga,
    tanggalLahir,
    gender,
    umur,
    pekerjaan,
    citizenId,
    steamHex,
    noHpIc,
    noKantong,
    keperluanSks,
    selectedDoctor,
    keluhanPoli,
    jenisOplas,
    fileKtpName,
    fileSkckName,
    fileKartuPasienName,
    keperluanPsikologi,
    keluhanPsikologi,
    tanggalTerbitSkwb,
    fileSkwbName,
    penyebabKematian,
    kronologiCk,
    jenisPemakaman,
    setujuPernyataanCk,
    paketFarmasiId,
    jumlahPaket,
  ]);

  const handleContinueDraft = () => {
    if (!pendingDraft) return;
    const { tab, snapshot } = pendingDraft;
    setPendingDraft(null);
    applyDraftDataToState(tab, snapshot.data);
  };

  const handleDiscardDraft = () => {
    if (!pendingDraft) return;
    const { tab } = pendingDraft;
    clearServiceDraft(tab);
    setPendingDraft(null);
    isHydratingRef.current = true;
    resetAllFormFields();
    setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  };

  const getSkwbValidity = () => {
    const parsed = parseIsoDateParts(tanggalTerbitSkwb) ?? { year: 2026, month: 10, day: 24 };
    const start = new Date(parsed.year, parsed.month, parsed.day);
    const end = new Date(parsed.year, parsed.month, parsed.day + 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isActive = end >= today;
    return {
      startStr: toIsoDateString(start.getFullYear(), start.getMonth(), start.getDate()),
      endStr: toIsoDateString(end.getFullYear(), end.getMonth(), end.getDate()),
      isActive,
    };
  };

  const skwbValidity = getSkwbValidity();

  const handleTabChange = (tab: ServiceType) => {
    evaluatedTabRef.current = null;
    setActiveTab(tab);
    setSubmittedReceipt(null);
    setCompletedPsychRecord(null);
    setConfirmCancelReceipt(false);
    setFormError(null);
    setPendingDraft(null);
    setSelectedDoctor(null);
    setIsDoctorPickerOpen(false);
    setIsIshiharaModalOpen(false);
    isHydratingRef.current = true;
    resetAllFormFields();
    setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
    setSearchParams({ tab });
  };

  const selectedPharmacyPackage =
    PHARMACY_ITEMS.find((p) => p.id === paketFarmasiId) ?? PHARMACY_ITEMS[0];

  const calculateEstimatedCost = (): number => {
    switch (activeTab) {
      case 'Surat Kesehatan':
        return 15000;
      case 'Janji Temu Poli':
        return 15000;
      case 'Operasi Plastik': {
        const found = PLASTIC_SURGERY_OPTIONS.find((o) => o.value === jenisOplas);
        return found?.price ?? 75000;
      }
      case 'Tes Buta Warna':
        return 0;
      case 'Tes Psikologi':
        return 25000;
      case 'Klaim Benefit SKWB':
        return 0;
      case 'Karakter Kill':
        return 50000;
      case 'Loket Farmasi':
        return selectedPharmacyPackage.harga * Math.max(1, jumlahPaket);
      default:
        return 0;
    }
  };

  const buildDetailPermintaan = (): string => {
    switch (activeTab) {
      case 'Surat Kesehatan':
        return `TTL: ${formatDisplayDateId(tanggalLahir) || '-'} | Gender: ${gender} | Umur: ${umur || '-'} Thn | Pekerjaan: ${pekerjaan || '-'} | Keperluan: ${keperluanSks}`;
      case 'Janji Temu Poli': {
        const docLabel = selectedDoctor
          ? formatStaffDisplayName(selectedDoctor)
          : 'Dokter Jaga Tersedia';
        return `Dokter: ${docLabel} | Keluhan: ${keluhanPoli || '-'}`;
      }
      case 'Operasi Plastik':
        return `Jenis: ${jenisOplas} | Umur: ${umur || '-'} Thn | Pekerjaan: ${pekerjaan || '-'} | Dokumen: ${fileKtpName || 'KTP'}, ${fileSkckName || 'SKCK/SKWB'}, ${fileKartuPasienName || 'Kartu Pasien'}`;
      case 'Klaim Benefit SKWB':
        return `Terbit SKWB: ${formatDisplayDateId(skwbValidity.startStr)} s/d ${formatDisplayDateId(skwbValidity.endStr)} (${skwbValidity.isActive ? 'Aktif' : 'Kedaluwarsa'}) | File: ${fileSkwbName || 'Terlampir'}`;
      case 'Karakter Kill':
        return `Gender: ${gender} | Umur: ${umur || '-'} Thn | Pekerjaan: ${pekerjaan || '-'} | SteamHex: ${steamHex || '-'} | Penyebab: ${penyebabKematian || '-'} | Pemakaman: ${jenisPemakaman} | Kronologi: ${kronologiCk || '-'}`;
      case 'Loket Farmasi':
        return `${selectedPharmacyPackage.nama} x${Math.max(1, jumlahPaket)} (No. Kantong: ${noKantong.trim() || '-'})`;
      default:
        return '-';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaWarga.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }

    // Tes Psikologi: tampilkan hasil lengkap rata tengah & simpan status Menunggu ACC Staf (sertifikat belum terbit)
    if (activeTab === 'Tes Psikologi') {
      if (!psychEvaluation) {
        setFormError(
          'Selesaikan seluruh tahap soal GHQ-12 dan DASS-21 terlebih dahulu untuk melihat hasil tes.'
        );
        return;
      }

      const uniqueSuffix = Date.now().toString().slice(-6);
      const record: StoredTestResultRecord = {
        id: `PSIK-${uniqueSuffix}`,
        approvalStatus: 'Menunggu ACC Staf',
        category: 'psikologi',
        namaPeserta: psychEvaluation.namaPeserta,
        tanggalLahir: psychEvaluation.tanggalLahir,
        umur: psychEvaluation.umur,
        gender: psychEvaluation.gender,
        citizenId: psychEvaluation.citizenId,
        pekerjaan: psychEvaluation.pekerjaan,
        noHpIc: psychEvaluation.noHpIc,
        tujuanEvaluasi: psychEvaluation.tujuanPemeriksaan,
        keluhanSingkat: psychEvaluation.keluhanSingkat,
        tanggalTes: formatNowTimestamp(),
        skorRingkas: `GHQ-12: ${psychEvaluation.ghqScore}/36 (${psychEvaluation.ghqKategori}) · DASS-21 -> Depresi: ${psychEvaluation.dassDepresiScore} (${psychEvaluation.dassDepresiKategori}), Kecemasan: ${psychEvaluation.dassKecemasanScore} (${psychEvaluation.dassKecemasanKategori}), Stres: ${psychEvaluation.dassStresScore} (${psychEvaluation.dassStresKategori})`,
        interpretasi: psychEvaluation.ghqKategori,
        status: 'Completed',
        psychDetail: psychEvaluation,
      };

      appendLocalTestResultRecord(record);
      setCompletedPsychRecord(record);
      setSubmittedReceipt(null);
      clearServiceDraft('Tes Psikologi');
      setPendingDraft(null);

      isHydratingRef.current = true;
      resetAllFormFields();
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);

      topAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (activeTab === 'Karakter Kill' && !setujuPernyataanCk) {
      setFormError('Centang pernyataan persetujuan data terlebih dahulu sebelum mengirim.');
      return;
    }

    const cleanName = namaWarga.trim();
    const cleanCitizen = citizenId.trim().toUpperCase() || 'Warga-KBR';
    const resolvedCitizenId =
      activeTab === 'Loket Farmasi'
        ? `KANTONG-${noKantong.trim() || '000'}`
        : cleanCitizen;
    const resolvedNoHpIc =
      activeTab === 'Loket Farmasi'
        ? `Kantong #${noKantong.trim() || '-'}`
        : noHpIc.trim() || '-';
    const resolvedDetail = buildDetailPermintaan();
    const resolvedCost = calculateEstimatedCost();
    const initialStatus = 'Menunggu Verifikasi';

    let ticketCode = `RSKBR-${Date.now().toString().slice(-5)}`;

    try {
      if (typeof submitCitizenService === 'function') {
        const created = submitCitizenService({
          jenisLayanan: activeTab,
          namaWarga: cleanName,
          citizenId: resolvedCitizenId,
          noHpIc: resolvedNoHpIc,
          dokterTujuanUid:
            activeTab === 'Janji Temu Poli' && selectedDoctor ? selectedDoctor.uid : undefined,
          detailPermintaan: resolvedDetail,
          totalBiayaKbrp: resolvedCost,
        });
        if (created?.kodeTiket) {
          ticketCode = created.kodeTiket;
        }
      }
    } catch {
      // Tetap lanjutkan jika context melempar error
    }

    appendLocalSubmissionRecord({
      kodeTiket: ticketCode,
      jenisLayanan: activeTab,
      namaWarga: cleanName,
      citizenId: resolvedCitizenId,
      noHpIc: resolvedNoHpIc,
      detailPermintaan: resolvedDetail,
      totalBiayaKbrp: resolvedCost,
      status: initialStatus,
    });
    window.dispatchEvent(new Event('rskbr:submissions-updated'));

    setSubmittedReceipt({
      ticket: ticketCode,
      jenisLayanan: activeTab,
      namaWarga: cleanName,
      citizenId: resolvedCitizenId,
      noHpIc: resolvedNoHpIc,
      detailPermintaan: resolvedDetail,
      biayaKbrp: resolvedCost,
      statusLabel: initialStatus,
    });
    setCompletedPsychRecord(null);
    setConfirmCancelReceipt(false);
    setCopiedTicket(false);

    if (activeTab !== 'Tes Buta Warna') {
      clearServiceDraft(activeTab);
    }
    setPendingDraft(null);

    isHydratingRef.current = true;
    resetAllFormFields();
    setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);

    topAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelSubmittedReceipt = () => {
    if (!submittedReceipt) return;
    updateLocalSubmissionStatus(
      submittedReceipt.ticket,
      submittedReceipt.jenisLayanan,
      'Dibatalkan'
    );
    window.dispatchEvent(new Event('rskbr:submissions-updated'));
    setSubmittedReceipt({
      ...submittedReceipt,
      statusLabel: 'Dibatalkan',
    });
    setConfirmCancelReceipt(false);
  };

  const handleCopyTicket = (ticket: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticket).catch(() => {});
    }
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  const currentSidebarGuide =
    activeTab !== 'Loket Farmasi' ? SERVICE_SIDEBAR_INFO[activeTab] : null;

  const isReceiptCancelled =
    (submittedReceipt?.statusLabel || '').toLowerCase().includes('batal');

  const renderQuestionBatch = (
    items: { id: string; prompt: string }[],
    startNumber: number,
    answersMap: Record<string, number>,
    onSelectAnswer: (id: string, val: number) => void
  ) => (
    <div className="mt-4 space-y-2.5">
      {items.map((q, idx) => (
        <div
          key={q.id}
          className="flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center"
        >
          <p className="text-xs font-semibold text-slate-800">
            <span className="mr-1.5 font-mono text-[11px] font-bold text-[#8B1515]">
              {startNumber + idx}.
            </span>
            {q.prompt}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {SCALE_OPTIONS.map((opt) => {
              const active = answersMap[q.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => onSelectAnswer(q.id, opt.value)}
                  className={`h-8 w-8 rounded-lg font-mono text-xs font-extrabold transition ${
                    active
                      ? 'bg-[#8B1515] text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-red-300'
                  }`}
                >
                  {opt.short}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={topAnchorRef} className="min-h-screen bg-[#F8FAFC] py-10 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              8 Modul Layanan Terpadu
            </p>
            <h1 className="mt-1 font-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Loket Pelayanan Medis Warga
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Pilih layanan medis yang Anda butuhkan. Warga tidak perlu login—tiket layanan
              langsung diteruskan ke tim medis, sedangkan hasil tes disimpan untuk di-ACC staf.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/riwayat-pengajuan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-[#8B1515] hover:text-[#8B1515]"
            >
              <History className="h-4 w-4 text-[#8B1515]" />
              <span>Riwayat Pengajuan</span>
            </Link>

            <Link
              to="/hasil-tes"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#6D0E0E]"
            >
              <Award className="h-4 w-4 text-amber-300" />
              <span>Hasil Tes</span>
            </Link>
          </div>
        </div>

        {/* Grid 8 Tab Layanan */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {SERVICE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                  isActive
                    ? 'border-[#8B1515] bg-[#8B1515] text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[11px] font-extrabold ${
                      isActive ? 'text-amber-300' : 'text-red-700'
                    }`}
                  >
                    {tab.num}
                  </span>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <p className="mt-3 text-xs font-bold leading-snug">{tab.shortLabel}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {formError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-[#8B1515]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* HASIL LENGKAP TES PSIKOLOGI (RATA TENGAH, SERTIFIKAT MENUNGGU ACC STAF) */}
            {completedPsychRecord && (
              <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-800 shadow-2xs sm:p-7">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <h3 className="mt-3 font-heading text-lg font-extrabold text-slate-950">
                  Hasil Lengkap Tes &amp; Evaluasi Psikologi
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Dicatat pada <span className="font-mono">{completedPsychRecord.tanggalTes}</span>{' '}
                  · ID Hasil: <span className="font-mono font-bold">{completedPsychRecord.id}</span>
                </p>

                <div className="mx-auto mt-5 max-w-2xl space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Identitas Peserta &amp; Tujuan
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">
                      {completedPsychRecord.namaPeserta}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {[
                        completedPsychRecord.gender,
                        completedPsychRecord.umur ? `${completedPsychRecord.umur} Thn` : null,
                        completedPsychRecord.pekerjaan,
                        completedPsychRecord.citizenId
                          ? `CID: ${completedPsychRecord.citizenId}`
                          : null,
                        completedPsychRecord.noHpIc ? `HP: ${completedPsychRecord.noHpIc}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8B1515]">
                      Tujuan: {completedPsychRecord.tujuanEvaluasi}
                    </p>
                  </div>

                  {completedPsychRecord.psychDetail && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B1515]">
                          Skor GHQ-12
                        </p>
                        <p className="mt-1 font-mono text-base font-extrabold text-slate-950">
                          {completedPsychRecord.psychDetail.ghqScore} / 36
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-slate-700">
                          {completedPsychRecord.psychDetail.ghqKategori}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B1515]">
                          Rincian DASS-21
                        </p>
                        <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                          Depresi: {completedPsychRecord.psychDetail.dassDepresiScore} (
                          {completedPsychRecord.psychDetail.dassDepresiKategori})
                        </p>
                        <p className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                          Kecemasan: {completedPsychRecord.psychDetail.dassKecemasanScore} (
                          {completedPsychRecord.psychDetail.dassKecemasanKategori})
                        </p>
                        <p className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                          Stres: {completedPsychRecord.psychDetail.dassStresScore} (
                          {completedPsychRecord.psychDetail.dassStresKategori})
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Interpretasi Psikologis
                    </p>
                    <p className="mt-1 text-xs font-extrabold text-amber-950">
                      {completedPsychRecord.interpretasi}
                    </p>
                    {completedPsychRecord.keluhanSingkat && (
                      <p className="mt-1.5 text-[11px] text-amber-900/90">
                        Catatan/Keluhan: {completedPsychRecord.keluhanSingkat}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-800">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Menunggu ACC Staf Rumah Sakit</span>
                    </span>{' '}
                    — Sertifikat belum diterbitkan dan baru dapat diunduh setelah hasil ini
                    disetujui oleh staf RS melalui Dashboard Staff.
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <Link
                    to="/hasil-tes?tab=psikologi"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#6D0E0E]"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-300" />
                    <span>Lihat di Halaman Hasil Tes</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCompletedPsychRecord(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Tutup Ringkasan
                  </button>
                </div>
              </div>
            )}

            {/* BANNER "PENGAJUAN LAYANAN BERHASIL TERCATAT!" */}
            {submittedReceipt && (
              <div
                className={`mb-6 rounded-2xl border p-5 text-xs shadow-2xs ${
                  isReceiptCancelled
                    ? 'border-red-200 bg-red-50/75 text-red-950'
                    : 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
                  <div className="flex items-center gap-2">
                    {isReceiptCancelled ? (
                      <Ban className="h-5 w-5 shrink-0 text-[#8B1515]" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    )}
                    <p
                      className={`text-sm font-extrabold ${
                        isReceiptCancelled ? 'text-[#8B1515]' : 'text-emerald-950'
                      }`}
                    >
                      {isReceiptCancelled
                        ? 'Pengajuan Layanan Dibatalkan'
                        : 'Pengajuan Layanan Berhasil Tercatat!'}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                      isReceiptCancelled
                        ? 'border-red-200 bg-white text-[#8B1515]'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>Status: {submittedReceipt.statusLabel}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p
                    className={`max-w-xl leading-relaxed ${
                      isReceiptCancelled ? 'text-red-900/90' : 'text-emerald-900'
                    }`}
                  >
                    Nomor Tiket Antrean Anda:{' '}
                    <span className="rounded bg-white px-2 py-0.5 font-mono font-extrabold text-slate-900 ring-1 ring-slate-200">
                      {submittedReceipt.ticket}
                    </span>{' '}
                    ({submittedReceipt.jenisLayanan} ·{' '}
                    <strong className="font-bold">{submittedReceipt.namaWarga}</strong>).{' '}
                    {isReceiptCancelled
                      ? 'Pengajuan ini telah dibatalkan karena kesalahan input atau permintaan warga.'
                      : 'Silakan menuju Pillbox Medical Center (Koordinat 201) untuk proses selanjutnya.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(submittedReceipt.ticket)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
                    >
                      {copiedTicket ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Tiket Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Salin Tiket</span>
                        </>
                      )}
                    </button>

                    <Link
                      to="/riwayat-pengajuan"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-800"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Lihat Riwayat Pengajuan</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>

                    {!isReceiptCancelled && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelReceipt((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-[#8B1515] transition hover:bg-red-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>Batalkan Pengajuan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedReceipt(null);
                        setConfirmCancelReceipt(false);
                        resetAllFormFields();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ajukan Baru</span>
                    </button>
                  </div>
                </div>

                {confirmCancelReceipt && !isReceiptCancelled && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-[#8B1515]">
                    <span className="font-semibold">
                      Yakin ingin membatalkan tiket <strong>{submittedReceipt.ticket}</strong> karena
                      salah isi data?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelReceipt(false)}
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Tidak
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelSubmittedReceipt}
                        className="rounded-lg bg-[#8B1515] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#6D0E0E]"
                      >
                        Ya, Batalkan
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3.5 grid gap-2.5 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Identitas &amp; Kontak
                    </p>
                    <p className="mt-0.5 font-bold text-slate-900">
                      {submittedReceipt.namaWarga} · {submittedReceipt.citizenId}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {submittedReceipt.noHpIc}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Biaya Administrasi
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-extrabold text-[#8B1515]">
                      {submittedReceipt.biayaKbrp > 0
                        ? formatKbrp(submittedReceipt.biayaKbrp)
                        : 'GRATIS'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Rincian Permintaan
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-700">
                      {submittedReceipt.detailPermintaan}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FORM 01: SURAT KETERANGAN SEHAT (SKS) */}
            {activeTab === 'Surat Kesehatan' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-950">
                      Formulir Surat Keterangan Sehat (SKS)
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pengurusan resmi SKS RS Kota Baru · Diverifikasi oleh Paramedic ke atas
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Nama Lengkap <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaWarga}
                      onChange={(e) => setNamaWarga(e.target.value)}
                      placeholder="Masukkan nama lengkap sesuai identitas"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Tanggal Lahir <span className="text-red-700">*</span>
                      </label>
                      <CustomDatePicker value={tanggalLahir} onChange={handleBirthDateChange} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Gender <span className="text-red-700">*</span>
                      </label>
                      <CustomSelect
                        value={gender}
                        onChange={setGender}
                        options={['Laki-laki', 'Perempuan']}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Umur (Tahun) <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={100}
                        value={umur}
                        onChange={(e) => setUmur(e.target.value)}
                        placeholder="Contoh: 25"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Pekerjaan <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={pekerjaan}
                        onChange={(e) => setPekerjaan(e.target.value)}
                        placeholder="Contoh: Wiraswasta / Mekanik"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        No HP / IC <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={noHpIc}
                        onChange={(e) => setNoHpIc(sanitizeDigitsOnly(e.target.value))}
                        placeholder="Contoh: 081234567890"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Keperluan <span className="text-red-700">*</span>
                      </label>
                      <CustomSelect
                        value={keperluanSks}
                        onChange={setKeperluanSks}
                        options={[
                          'Pemeriksaan Rutin',
                          'Melamar Pekerjaan Instansi',
                          'Pembuatan / Perpanjangan Lisensi',
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      clearServiceDraft('Surat Kesehatan');
                      resetAllFormFields();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                  >
                    Kirim Pengajuan SKS
                  </button>
                </div>
              </form>
            )}

            {/* FORM 02: JANJI TEMU POLI */}
            {activeTab === 'Janji Temu Poli' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-950">
                      Formulir Pengajuan: Janji Temu Poli
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pilih dokter praktik untuk membuat janji temu konsultasi langsung &amp;
                      Auto-Tag Discord.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Nama Lengkap (IC) <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaWarga}
                      onChange={(e) => setNamaWarga(e.target.value)}
                      placeholder="Contoh: Bima Baskara"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Citizen ID <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value)}
                      placeholder="CONTOH: KBRP-88210"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Nomor HP (IC) <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={noHpIc}
                      onChange={(e) => setNoHpIc(sanitizeDigitsOnly(e.target.value))}
                      placeholder="Contoh: 081234567890"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Pilih Dokter Tujuan<span className="text-red-700">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDoctorPickerOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#8B1515] transition hover:border-[#8B1515]"
                    >
                      <span>
                        {isDoctorPickerOpen
                          ? 'Sembunyikan Jadwal Dokter'
                          : selectedDoctor
                            ? 'Ganti Dokter'
                            : 'Lihat Jadwal & Pilih Dokter'}
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isDoctorPickerOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {selectedDoctor && (
                    <div className="mt-2 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8B1515] font-heading text-xs font-extrabold text-white">
                          {(selectedDoctor.namaIc || 'DR')
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-950">
                            {formatStaffDisplayName(selectedDoctor)}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {selectedDoctor.role} · {selectedDoctor.divisi} ·{' '}
                            <span className="font-semibold text-emerald-700">
                              {selectedDoctor.statusDuty === 'on_duty' ? 'Available' : 'Terjadwal'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDoctor(null)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-[#8B1515]"
                      >
                        Lepas
                      </button>
                    </div>
                  )}

                  {isDoctorPickerOpen && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <p className="text-xs font-extrabold text-slate-900">
                          Jadwal Praktik Dokter RS Kota Baru ({filteredDoctors.length})
                        </p>
                        <CustomSelect
                          compact
                          value={filterDivisiDokter}
                          onChange={setFilterDivisiDokter}
                          options={[
                            'Semua Spesialisasi',
                            'Poli Umum',
                            'IGD',
                            'Bedah Plastik',
                            'Psikologi',
                          ]}
                        />
                      </div>

                      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                        {filteredDoctors.map((doc) => {
                          const isAvailable = doc.statusDuty === 'on_duty';
                          const isPicked = selectedDoctor?.uid === doc.uid;
                          return (
                            <div
                              key={doc.uid}
                              className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
                                isPicked
                                  ? 'border-2 border-[#8B1515] bg-red-50/20'
                                  : 'border-slate-200 bg-white hover:border-red-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1515] to-[#4A0808] font-heading text-xs font-extrabold text-white">
                                  {(doc.namaIc || 'DR')
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                                <div>
                                  <h4 className="font-heading text-xs font-extrabold text-slate-950">
                                    {formatStaffDisplayName(doc)}
                                  </h4>
                                  <p className="text-[11px] text-slate-500">
                                    {doc.role} · {doc.divisi}
                                  </p>
                                  <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    Senin – Sabtu ·{' '}
                                    <span
                                      className={`font-bold ${
                                        isAvailable ? 'text-emerald-600' : 'text-amber-600'
                                      }`}
                                    >
                                      {isAvailable ? 'Available' : 'Terjadwal'}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDoctor(doc);
                                  setIsDoctorPickerOpen(false);
                                }}
                                className="mt-3 w-full rounded-xl bg-[#8B1515] py-2 text-xs font-bold text-white transition hover:bg-[#6D0E0E]"
                              >
                                {isPicked ? 'Dokter Terpilih' : 'Pilih Dokter Ini'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-bold text-slate-800">
                    Keluhan / Tujuan Konsultasi <span className="text-red-700">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={keluhanPoli}
                    onChange={(e) => setKeluhanPoli(e.target.value)}
                    placeholder="Jelaskan keluhan kesehatan atau jadwal konsultasi yang diinginkan..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B1515] py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                >
                  <Send className="h-4 w-4" />
                  Kirim Pengajuan Janji Temu Poli
                </button>
              </form>
            )}

            {/* FORM 03: PENGAJUAN PROSEDUR OPERASI PLASTIK */}
            {activeTab === 'Operasi Plastik' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-950">
                      Pengajuan Prosedur Operasi Plastik
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Bedah Rekonstruksi &amp; Estetika oleh Tim Dokter Spesialis RS Kota Baru
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Nama Lengkap <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaWarga}
                      onChange={(e) => setNamaWarga(e.target.value)}
                      placeholder="Nama lengkap pasien"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Tanggal Lahir <span className="text-red-700">*</span>
                      </label>
                      <CustomDatePicker value={tanggalLahir} onChange={handleBirthDateChange} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Gender <span className="text-red-700">*</span>
                      </label>
                      <CustomSelect
                        value={gender}
                        onChange={setGender}
                        options={['Perempuan', 'Laki-laki']}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Umur (Tahun) <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="number"
                        min={18}
                        value={umur}
                        onChange={(e) => setUmur(e.target.value)}
                        placeholder="Minimal 18 tahun"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Pekerjaan <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={pekerjaan}
                        onChange={(e) => setPekerjaan(e.target.value)}
                        placeholder="Pekerjaan pasien"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        No HP / IC <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={noHpIc}
                        onChange={(e) => setNoHpIc(sanitizeDigitsOnly(e.target.value))}
                        placeholder="Nomor HP / IC (angka saja)"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Jenis Operasi Plastik <span className="text-red-700">*</span>
                      </label>
                      <CustomSelect
                        value={jenisOplas}
                        onChange={setJenisOplas}
                        options={PLASTIC_SURGERY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Upload Foto Identitas / KTP (JPG/PNG) <span className="text-red-700">*</span>
                      </label>
                      <label className="mt-1.5 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 transition hover:border-[#8B1515]">
                        <span className="truncate">{fileKtpName || 'Pilih file foto KTP...'}</span>
                        <Upload className="h-4 w-4 shrink-0 text-[#8B1515]" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setFileKtpName(e.target.files?.[0]?.name || '')}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Upload Foto Kartu Pasien (JPG/PNG) <span className="text-red-700">*</span>
                      </label>
                      <label className="mt-1.5 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 transition hover:border-[#8B1515]">
                        <span className="truncate">
                          {fileKartuPasienName || 'Pilih file foto Kartu Pasien...'}
                        </span>
                        <Upload className="h-4 w-4 shrink-0 text-[#8B1515]" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setFileKartuPasienName(e.target.files?.[0]?.name || '')}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 transition hover:border-[#8B1515]">
                      <span className="truncate">
                        {fileSkckName || 'Pilih dokumen SKCK / SKWB...'}
                      </span>
                      <Upload className="h-4 w-4 shrink-0 text-[#8B1515]" />
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => setFileSkckName(e.target.files?.[0]?.name || '')}
                      />
                    </label>
                    <p className="mt-1.5 text-xs font-bold text-slate-800">
                      Upload Dokumen SKCK (Kepolisian) atau SKWB (PDF/JPG/PNG){' '}
                      <span className="text-red-700">*</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      clearServiceDraft('Operasi Plastik');
                      resetAllFormFields();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                  >
                    Ajukan Operasi Plastik
                  </button>
                </div>
              </form>
            )}

            {/* FORM 04: TES BUTA WARNA */}
            {activeTab === 'Tes Buta Warna' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-extrabold text-slate-950">
                        Uji Penglihatan Warna — 20 Lempeng Ishihara
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Pemeriksaan mandiri langsung melalui website RS Kota Baru · Sertifikat
                        terbit setelah di-ACC oleh staf rumah sakit.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                    GRATIS · ACC STAF UNTUK SERTIFIKAT
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/35 p-6">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="max-w-lg">
                      <p className="text-sm font-extrabold text-slate-950">
                        Siap Memulai Tes Buta Warna Ishihara?
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        Anda akan diuji menggunakan 20 lempeng pseudo-isokromatik standar klinis.
                        Setelah selesai, hasil lengkap ditampilkan dan masuk ke halaman{' '}
                        <strong>Hasil Tes</strong> untuk menunggu ACC staf RS sebelum sertifikat
                        diterbitkan.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsIshiharaModalOpen(true)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                    >
                      <Play className="h-4 w-4" />
                      {ishiharaResult ? 'Ulangi Tes 20 Lempeng' : 'Mulai Tes Buta Warna'}
                    </button>
                  </div>

                  {ishiharaResult && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Hasil Lengkap Uji Ishihara — {ishiharaResult.namaPeserta}
                        {lastIshiharaRecordId ? ` · ID: ${lastIshiharaRecordId}` : ''}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#8B1515]">
                        Kategori Diagnosis: {ishiharaResult.kategoriDiagnosis}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-mono text-xs font-bold">
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          Akurasi: {ishiharaResult.akurasiPersen}%
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
                          Benar: {ishiharaResult.benar}/20
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
                          Salah: {ishiharaResult.salah}/20
                        </span>
                      </div>

                      <p className="mt-3 text-[11px] font-semibold text-amber-800">
                        Status Sertifikat: Menunggu ACC Staf Rumah Sakit di Dashboard Staff.
                      </p>

                      <div className="mt-3">
                        <Link
                          to="/hasil-tes?tab=buta_warna"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#8B1515] px-3.5 py-1.5 font-sans text-xs font-bold text-white hover:bg-[#6D0E0E]"
                        >
                          <Award className="h-3.5 w-3.5 text-amber-300" />
                          <span>Lihat Hasil Lengkap</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FORM 05: TES PSIKOLOGI */}
            {activeTab === 'Tes Psikologi' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-extrabold text-slate-950">
                        Tes &amp; Evaluasi Psikologi (GHQ-12 &amp; DASS-21)
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Lengkapi seluruh data diri terlebih dahulu, lalu kerjakan soal tes secara
                        bertahap.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[11px] font-bold text-slate-700">
                    GHQ: {Object.keys(ghqAnswers).length}/12 · DASS: {Object.keys(dassAnswers).length}/21
                  </span>
                </div>

                {/* TAHAP 1: DATA DIRI */}
                {psychStep === 'identity' && (
                  <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 pb-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#8B1515]">
                        Data Diri Peserta
                      </p>
                      <span className="text-[11px] text-slate-400">Kerahasiaan Medis Terjamin</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Nama Lengkap (IC) <span className="text-red-700">*</span>
                        </label>
                        <input
                          type="text"
                          value={namaWarga}
                          onChange={(e) => setNamaWarga(e.target.value)}
                          placeholder="Contoh: Bima Baskara"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Tanggal Lahir <span className="text-red-700">*</span>
                          </label>
                          <CustomDatePicker value={tanggalLahir} onChange={handleBirthDateChange} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Umur (Tahun) <span className="text-red-700">*</span>
                          </label>
                          <input
                            type="number"
                            min={15}
                            max={100}
                            value={umur}
                            onChange={(e) => setUmur(e.target.value)}
                            placeholder="Contoh: 24"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Gender <span className="text-red-700">*</span>
                          </label>
                          <CustomSelect
                            value={gender}
                            onChange={setGender}
                            options={['Laki-laki', 'Perempuan']}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Citizen ID <span className="text-red-700">*</span>
                          </label>
                          <input
                            type="text"
                            value={citizenId}
                            onChange={(e) => setCitizenId(e.target.value)}
                            placeholder="CONTOH: KBRP-88210"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase focus:border-[#8B1515] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Pekerjaan <span className="text-red-700">*</span>
                          </label>
                          <input
                            type="text"
                            value={pekerjaan}
                            onChange={(e) => setPekerjaan(e.target.value)}
                            placeholder="Pekerjaan saat ini"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Nomor HP / IC <span className="text-red-700">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={noHpIc}
                            onChange={(e) => setNoHpIc(sanitizeDigitsOnly(e.target.value))}
                            placeholder="Contoh: 081234567890"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm focus:border-[#8B1515] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            Tujuan Evaluasi Psikologi <span className="text-red-700">*</span>
                          </label>
                          <CustomSelect
                            value={keperluanPsikologi}
                            onChange={setKeperluanPsikologi}
                            options={[
                              'Rekrutmen Kepolisian / Instansi',
                              'Syarat Kelayakan Kerja / Rekrutmen',
                              'Pengajuan Lisensi Senjata / Khusus',
                              'Evaluasi Kesehatan Mental Mandiri',
                            ]}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Keluhan / Riwayat Psikologis Singkat
                        </label>
                        <textarea
                          rows={2}
                          value={keluhanPsikologi}
                          onChange={(e) => setKeluhanPsikologi(e.target.value)}
                          placeholder="Opsional: jelaskan secara singkat keluhan atau latar belakang pengajuan..."
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAHAP 2: GHQ-12 SOAL 1–6 */}
                {psychStep === 'ghq_1' && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <h3 className="font-heading text-sm font-extrabold text-slate-950">
                      GHQ-12 — Soal 1 dari 12 s/d 6 dari 12
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      0 = Tidak Pernah · 1 = Jarang · 2 = Kadang-kadang · 3 = Sering / Hampir Selalu
                    </p>
                    {renderQuestionBatch(GHQ12_QUESTIONS.slice(0, 6), 1, ghqAnswers, (id, val) =>
                      setGhqAnswers((prev) => ({ ...prev, [id]: val }))
                    )}
                  </div>
                )}

                {/* TAHAP 3: GHQ-12 SOAL 7–12 */}
                {psychStep === 'ghq_2' && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <h3 className="font-heading text-sm font-extrabold text-slate-950">
                      GHQ-12 — Soal 7 dari 12 s/d 12 dari 12
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      0 = Tidak Pernah · 1 = Jarang · 2 = Kadang-kadang · 3 = Sering / Hampir Selalu
                    </p>
                    {renderQuestionBatch(GHQ12_QUESTIONS.slice(6, 12), 7, ghqAnswers, (id, val) =>
                      setGhqAnswers((prev) => ({ ...prev, [id]: val }))
                    )}
                  </div>
                )}

                {/* TAHAP 4: DASS-21 SOAL 1–7 */}
                {psychStep === 'dass_1' && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <h3 className="font-heading text-sm font-extrabold text-slate-950">
                      DASS-21 — Soal 1 dari 21 s/d 7 dari 21
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      0 = Tidak Pernah · 1 = Jarang · 2 = Kadang-kadang · 3 = Sering / Hampir Selalu
                    </p>
                    {renderQuestionBatch(DASS21_QUESTIONS.slice(0, 7), 1, dassAnswers, (id, val) =>
                      setDassAnswers((prev) => ({ ...prev, [id]: val }))
                    )}
                  </div>
                )}

                {/* TAHAP 5: DASS-21 SOAL 8–14 */}
                {psychStep === 'dass_2' && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <h3 className="font-heading text-sm font-extrabold text-slate-950">
                      DASS-21 — Soal 8 dari 21 s/d 14 dari 21
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      0 = Tidak Pernah · 1 = Jarang · 2 = Kadang-kadang · 3 = Sering / Hampir Selalu
                    </p>
                    {renderQuestionBatch(DASS21_QUESTIONS.slice(7, 14), 8, dassAnswers, (id, val) =>
                      setDassAnswers((prev) => ({ ...prev, [id]: val }))
                    )}
                  </div>
                )}

                {/* TAHAP 6: DASS-21 SOAL 15–21 */}
                {psychStep === 'dass_3' && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <h3 className="font-heading text-sm font-extrabold text-slate-950">
                      DASS-21 — Soal 15 dari 21 s/d 21 dari 21
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      0 = Tidak Pernah · 1 = Jarang · 2 = Kadang-kadang · 3 = Sering / Hampir Selalu
                    </p>
                    {renderQuestionBatch(
                      DASS21_QUESTIONS.slice(14, 21),
                      15,
                      dassAnswers,
                      (id, val) => setDassAnswers((prev) => ({ ...prev, [id]: val }))
                    )}
                  </div>
                )}

                {/* TAHAP 7: RINGKASAN & LIHAT HASIL LENGKAP */}
                {psychStep === 'summary' && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-center text-xs">
                    <h3 className="font-heading text-sm font-extrabold text-emerald-950">
                      Ringkasan Hasil Evaluasi Psikologi
                    </h3>
                    {psychEvaluation ? (
                      <div className="mt-3 space-y-2 text-slate-800">
                        <p>
                          <strong>Peserta:</strong> {psychEvaluation.namaPeserta} ({psychEvaluation.gender} ·{' '}
                          {psychEvaluation.umur} th · {psychEvaluation.pekerjaan}) ·{' '}
                          <span className="font-mono">{psychEvaluation.citizenId}</span>
                        </p>
                        <p>
                          <strong>Tujuan:</strong> {psychEvaluation.tujuanPemeriksaan}
                        </p>
                        <p>
                          <strong>GHQ-12:</strong>{' '}
                          <span className="font-mono font-bold text-[#8B1515]">
                            {psychEvaluation.ghqScore}/36
                          </span>{' '}
                          — <strong>{psychEvaluation.ghqKategori}</strong>
                        </p>
                        <p>
                          <strong>DASS-21:</strong> D:<strong>{psychEvaluation.dassDepresiScore}</strong> (
                          {psychEvaluation.dassDepresiKategori}) · K:
                          <strong>{psychEvaluation.dassKecemasanScore}</strong> (
                          {psychEvaluation.dassKecemasanKategori}) · S:
                          <strong>{psychEvaluation.dassStresScore}</strong> (
                          {psychEvaluation.dassStresKategori})
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-amber-800">
                        Masih ada butir soal yang belum terjawab. Gunakan tombol{' '}
                        <strong>Sebelumnya</strong> untuk melengkapi seluruh soal.
                      </p>
                    )}
                  </div>
                )}

                {/* Navigasi Bawah */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  {psychStep === 'identity' ? (
                    <p className="text-[11px] text-slate-500">
                      {isIdentityReadyForPsychTest
                        ? 'Semua data diri wajib sudah terisi. Klik Mulai Tes untuk melanjutkan.'
                        : 'Isi seluruh data diri wajib terlebih dahulu untuk memulai tes.'}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePrevPsychStep}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Sebelumnya</span>
                    </button>
                  )}

                  {psychStep === 'identity' ? (
                    <button
                      type="button"
                      disabled={!isIdentityReadyForPsychTest}
                      onClick={handleNextPsychStep}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                        isIdentityReadyForPsychTest
                          ? 'bg-[#8B1515] text-white shadow-xs hover:bg-[#6D0E0E]'
                          : 'cursor-not-allowed bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Mulai Tes</span>
                    </button>
                  ) : psychStep !== 'summary' ? (
                    <button
                      type="button"
                      onClick={handleNextPsychStep}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                    >
                      <span>Selanjutnya</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                    >
                      <Award className="h-4 w-4 text-amber-300" />
                      <span>Selesaikan &amp; Lihat Hasil Tes</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* FORM 06: KLAIM BENEFIT SKWB */}
            {activeTab === 'Klaim Benefit SKWB' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-950">
                      Klaim Benefit SKWB
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Formulir Pendaftaran &amp; Klaim Benefit Kesehatan Surat Keterangan Warga Baru
                      (Berlaku 7 Hari Sejak Tanggal Terbit SKWB)
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/35 p-4">
                  <p className="text-xs font-extrabold text-slate-900">
                    Informasi Hak &amp; Masa Berlaku Benefit SKWB (7 Hari Sejak Tanggal Terbit
                    SKWB):
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                      <p className="text-xs font-extrabold text-slate-900">
                        1. Free Operasi Plastik 1x
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Gratis 1x Operasi Plastik selama periode SKWB aktif (Oleh Doctor+)
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                      <p className="text-xs font-extrabold text-slate-900">
                        2. Diskon 50% Layanan Treatment
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Potongan 50% layanan treatment selama periode SKWB aktif (Oleh
                        Nurse/Paramedic+)
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                      <p className="text-xs font-extrabold text-slate-900">
                        3. Gratis 1x Paket Perban
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Gratis 1x paket perban steril selama periode SKWB aktif (Oleh Co-ass+)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Nama IC (Sesuai Identitas) <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaWarga}
                      onChange={(e) => setNamaWarga(e.target.value)}
                      placeholder="Masukkan nama lengkap sesuai identitas IC Anda"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Tanggal Lahir <span className="text-red-700">*</span>
                      </label>
                      <CustomDatePicker value={tanggalLahir} onChange={setTanggalLahir} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Tanggal Terbit SKWB <span className="text-red-700">*</span>
                      </label>
                      <CustomDatePicker
                        value={tanggalTerbitSkwb}
                        onChange={setTanggalTerbitSkwb}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
                    <span className="text-slate-600">
                      Perhitungan Masa Berlaku Otomatis (7 Hari):{' '}
                      <strong className="font-mono text-slate-900">
                        {formatDisplayDateId(skwbValidity.startStr)} s/d{' '}
                        {formatDisplayDateId(skwbValidity.endStr)}
                      </strong>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        skwbValidity.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      Status: {skwbValidity.isActive ? 'Aktif' : 'Kedaluwarsa'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Upload Foto Surat Keterangan Warga Baru (SKWB){' '}
                      <span className="text-red-700">*</span>
                    </label>
                    <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50/15 px-4 py-6 text-center transition hover:border-[#8B1515]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#8B1515]">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-800">
                        {fileSkwbName || 'Klik untuk memilih Foto Surat SKWB'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Mendukung format JPG, JPEG, PNG, WEBP (Maks. 5 MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFileSkwbName(e.target.files?.[0]?.name || '')}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      clearServiceDraft('Klaim Benefit SKWB');
                      resetAllFormFields();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                  >
                    Simpan / Ajukan Klaim
                  </button>
                </div>
              </form>
            )}

            {/* FORM 07: KARAKTER KILL (CK) */}
            {activeTab === 'Karakter Kill' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-950">
                      Karakter Kill
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Formulir Pengajuan Kematian Karakter (Character Kill) &amp; Administrasi
                      Pemakaman Warga
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/20 p-5">
                  <h3 className="font-heading text-sm font-extrabold text-[#8B1515]">Data Diri</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Identitas warga yang diajukan dalam laporan Karakter Kill (CK).
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Nama Lengkap <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaWarga}
                        onChange={(e) => setNamaWarga(e.target.value)}
                        placeholder="Masukkan nama lengkap karakter (IC)"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Tanggal Lahir <span className="text-red-700">*</span>
                        </label>
                        <CustomDatePicker value={tanggalLahir} onChange={handleBirthDateChange} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Jenis Kelamin <span className="text-red-700">*</span>
                        </label>
                        <CustomSelect
                          value={gender}
                          onChange={setGender}
                          options={['Laki-laki', 'Perempuan']}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Umur <span className="text-red-700">*</span>
                        </label>
                        <input
                          type="number"
                          value={umur}
                          onChange={(e) => setUmur(e.target.value)}
                          placeholder="Contoh: 28"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Pekerjaan <span className="text-red-700">*</span>
                        </label>
                        <input
                          type="text"
                          value={pekerjaan}
                          onChange={(e) => setPekerjaan(e.target.value)}
                          placeholder="Pekerjaan karakter di kota"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Citizen ID <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={citizenId}
                        onChange={(e) => setCitizenId(e.target.value)}
                        placeholder="Masukkan Citizen ID (KTP)"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        SteamHex <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={steamHex}
                        onChange={(e) => setSteamHex(e.target.value)}
                        placeholder="Contoh: steam:11000010a4b8c9d"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        No HP (IC) <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={noHpIc}
                        onChange={(e) => setNoHpIc(sanitizeDigitsOnly(e.target.value))}
                        placeholder="Masukkan nomor HP IC (angka saja)"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/20 p-5">
                  <h3 className="font-heading text-sm font-extrabold text-[#8B1515]">
                    Kronologi dan Penyebab Kematian
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Rincian medis penyebab kematian, kronologi lengkap kejadian CK, dan jenis
                    pemakaman.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Penyebab Kematian <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={penyebabKematian}
                        onChange={(e) => setPenyebabKematian(e.target.value)}
                        placeholder="Contoh: Luka tembak di bagian dada / Trauma kepala berat"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Kronologi CK <span className="text-red-700">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={kronologiCk}
                        onChange={(e) => setKronologiCk(e.target.value)}
                        placeholder="Tuliskan kronologi lengkap kejadian Character Kill (CK)..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Jenis Pemakaman <span className="text-red-700">*</span>
                      </label>
                      <CustomSelect
                        value={jenisPemakaman}
                        onChange={setJenisPemakaman}
                        options={['Penguburan', 'Kremasi']}
                      />
                    </div>
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-red-100 bg-white p-3.5 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={setujuPernyataanCk}
                    onChange={(e) => setSetujuPernyataanCk(e.target.checked)}
                    className="accent-[#8B1515]"
                  />
                  Saya yakin seluruh data yang saya isi sudah benar dan saya bertanggung jawab atas
                  keakuratan data tersebut.
                </label>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearServiceDraft('Karakter Kill');
                      resetAllFormFields();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                  >
                    Kirim Pengajuan Karakter Kill
                  </button>
                </div>
              </form>
            )}

            {/* FORM 08: LOKET FARMASI */}
            {activeTab === 'Loket Farmasi' && (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-950">
                      Layanan Farmasi RS Kota Baru
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Isi form berikut untuk membeli perban dan obat-obatan di farmasi RS Kota Baru.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/75 p-4 text-xs text-slate-800">
                    <div className="flex items-center gap-2 font-extrabold text-amber-800">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Syarat Pembelian Obat:</span>
                    </div>
                    <p className="mt-1.5 font-bold text-slate-900">
                      Wajib memperlihatkan KTP/Kartu Pasien/KTA kepada petugas farmasi
                    </p>
                    <p className="mt-1 text-[11px] text-amber-900/90">
                      *Maksimal pembelian 2 paket jika tanpa KTA, dan maksimal 3 paket jika
                      memperlihatkan KTA kepada petugas di loker farmasi.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Nama : <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaWarga}
                        onChange={(e) => setNamaWarga(e.target.value)}
                        placeholder="Contoh: Alex Pratama"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        No. Kantong saat ini : <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={noKantong}
                        onChange={(e) => setNoKantong(e.target.value)}
                        placeholder="Contoh: 142"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Pilih Paket : <span className="text-red-700">*</span>
                    </label>
                    <div className="mt-2.5 grid gap-3.5 sm:grid-cols-2">
                      {PHARMACY_ITEMS.map((item) => {
                        const isSelected = paketFarmasiId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPaketFarmasiId(item.id)}
                            className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                              isSelected
                                ? 'border-2 border-[#8B1515] bg-red-50/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-red-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-extrabold ${
                                    isSelected
                                      ? 'bg-[#8B1515] text-white'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {item.kodeHuruf}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">
                                  {item.nama}
                                </span>
                              </div>

                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                  isSelected ? 'border-[#8B1515]' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && (
                                  <span className="h-2 w-2 rounded-full bg-[#8B1515]" />
                                )}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                              <span className="text-[11px] text-slate-400">Harga Satuan</span>
                              <span
                                className={`font-mono font-extrabold ${
                                  isSelected ? 'text-[#8B1515]' : 'text-slate-800'
                                }`}
                              >
                                {formatKbrp(item.harga)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Jumlah : <span className="text-red-700">*</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Maksimal 2 paket jika tanpa KTA, atau maksimal 3 paket jika
                          memperlihatkan KTA di loket.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => setJumlahPaket((prev) => Math.max(1, prev - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-[#8B1515] hover:text-[#8B1515]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-1 text-center font-mono text-sm font-extrabold text-slate-900">
                          {jumlahPaket}
                        </span>
                        <button
                          type="button"
                          onClick={() => setJumlahPaket((prev) => Math.min(3, prev + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-[#8B1515] hover:text-[#8B1515]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="ml-1 text-xs font-semibold text-slate-600">Paket</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3.5 text-xs">
                      <span className="text-slate-600">
                        Kalkulasi Biaya: ({jumlahPaket}x @{' '}
                        {formatKbrp(selectedPharmacyPackage.harga)})
                      </span>
                      <span className="font-mono text-sm font-extrabold text-emerald-700">
                        Total: {formatKbrp(calculateEstimatedCost())}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        clearServiceDraft('Loket Farmasi');
                        resetAllFormFields();
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#6D0E0E]"
                    >
                      <Pill className="h-3.5 w-3.5" />
                      Kirim Pesanan Farmasi
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* PANEL KANAN DINAMIS */}
          <div className="space-y-5 lg:col-span-4">
            {activeTab === 'Loket Farmasi' ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                <h3 className="font-heading text-lg font-extrabold text-slate-950">
                  Daftar Harga Paket Farmasi
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Instalasi Farmasi Pillbox Medical Center buka 24 Jam.
                </p>

                <div className="mt-4 space-y-3">
                  {PHARMACY_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-slate-900">{item.nama}</p>
                        <span className="font-mono text-xs font-extrabold text-red-800">
                          {formatKbrp(item.harga)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {item.deskripsi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              currentSidebarGuide && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                  <div className="flex items-center gap-2 text-red-800">
                    <Info className="h-5 w-5" />
                    <h3 className="font-heading text-lg font-extrabold text-slate-950">
                      {currentSidebarGuide.judul}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{currentSidebarGuide.subjudul}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-red-100 bg-red-50/60 p-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-700">
                        <DollarSign className="h-3 w-3" />
                        Biaya Resmi
                      </span>
                      <p className="mt-1 font-mono text-xs font-extrabold text-slate-900">
                        {currentSidebarGuide.estimasiBiaya}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                        <Clock className="h-3 w-3" />
                        Estimasi Proses
                      </span>
                      <p className="mt-1 text-xs font-bold text-slate-800">
                        {currentSidebarGuide.waktuProses}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                      <ClipboardCheck className="h-4 w-4 text-red-800" />
                      Syarat &amp; Alur Pelayanan
                    </p>
                    <ul className="mt-2.5 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-600">
                      {currentSidebarGuide.poinKetentuan.map((poin, idx) => (
                        <li key={idx}>{poin}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}

            <div className="rounded-3xl bg-gradient-to-br from-[#6D0E0E] to-[#3B0707] p-6 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-300" />
                <h3 className="font-heading text-base font-extrabold">
                  Integrasi Discord RS Kota Baru
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-red-100/90">
                Setiap pengajuan layanan otomatis tercatat pada kanal administrasi RS Kota Baru.
                Khusus pengajuan Janji Temu Poli, dokter yang Anda pilih akan langsung menerima
                notifikasi <em>mention</em> di Discord.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL POP-UP KONFIRMASI MELANJUTKAN PENGISIAN FORMULIR (DRAF) */}
      {pendingDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={handleDiscardDraft}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#8B1515]">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-extrabold text-slate-950">
                    Lanjutkan Pengisian Formulir?
                  </h3>
                  <p className="text-xs text-slate-500">Draf tersimpan untuk {pendingDraft.tab}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup modal draf"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              Ditemukan draf tersimpan untuk <strong>{pendingDraft.tab}</strong>
              {typeof pendingDraft.snapshot.data.namaWarga === 'string' &&
              pendingDraft.snapshot.data.namaWarga.trim() ? (
                <>
                  {' '}
                  atas nama <strong>{pendingDraft.snapshot.data.namaWarga.trim()}</strong>
                </>
              ) : null}
              . Apakah Anda ingin melanjutkan isian sebelumnya atau memulai formulir baru?
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Mulai Baru</span>
              </button>
              <button
                type="button"
                onClick={handleContinueDraft}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#6D0E0E]"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Lanjutkan Draf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UJI PENGLIHATAN WARNA 20 LEMPENG ISHIHARA */}
      <IshiharaTestModal
        isOpen={isIshiharaModalOpen}
        onClose={() => setIsIshiharaModalOpen(false)}
        defaultName={namaWarga}
        onCompleteTest={(res) => {
          const suffix = Date.now().toString().slice(-6);
          const recordId = `ISH-${suffix}`;
          const record: StoredTestResultRecord = {
            id: recordId,
            approvalStatus: 'Menunggu ACC Staf',
            category: 'buta_warna',
            namaPeserta: res.namaPeserta || namaWarga.trim() || 'Peserta Tes',
            citizenId: citizenId.trim().toUpperCase() || undefined,
            noHpIc: noHpIc.trim() || undefined,
            tujuanEvaluasi: 'Uji Penglihatan Warna (20 Lempeng Ishihara)',
            tanggalTes: formatNowTimestamp(),
            skorRingkas: `Benar: ${res.benar}/20 · Salah: ${res.salah}/20 · Akurasi: ${res.akurasiPersen}%`,
            interpretasi: res.kategoriDiagnosis,
            status: 'Completed',
            ishiharaDetail: res,
          };
          appendLocalTestResultRecord(record);
          setIshiharaResult(res);
          setLastIshiharaRecordId(recordId);
          if (!namaWarga.trim() && res.namaPeserta) {
            setNamaWarga(res.namaPeserta);
          }
        }}
      />
    </div>
  );
}

export default ServicesPage;