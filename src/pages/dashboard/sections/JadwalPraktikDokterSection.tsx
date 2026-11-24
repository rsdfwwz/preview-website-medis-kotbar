import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { formatStaffDisplayName } from '@/utils/formatters';
import type { PortalStaffMember } from '../types';

export type DoctorScheduleStatus = 'Available' | 'On Duty' | 'Break' | 'Off';

export interface DoctorPracticeScheduleItem {
  id: string;
  staffUid: string;
  doctorName: string;
  specialty: string;
  daysLabel: string;
  startTime: string;
  endTime: string;
  status: DoctorScheduleStatus;
  avatarUrl?: string;
}

interface JadwalPraktikDokterSectionProps {
  activeStaffList: PortalStaffMember[];
  currentUser?: PortalStaffMember | null;
  schedules?: DoctorPracticeScheduleItem[];
  onSchedulesChange?: (nextSchedules: DoctorPracticeScheduleItem[]) => void;
  onPublishToPublic?: (schedule: DoctorPracticeScheduleItem) => void;
  onNotify?: (msg: string) => void;
}

interface CustomDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectDropdownProps {
  value: string;
  options: CustomDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function CustomSelectDropdown({
  value,
  options,
  placeholder = 'Pilih opsi...',
  disabled = false,
  onChange,
}: CustomSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-xs transition ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
            : open
              ? 'border-[#8B1515] ring-2 ring-rose-100'
              : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? 'font-medium text-slate-900' : 'text-slate-400'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400">
              Tidak ada dokter dengan gelar &amp; role yang sesuai
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs transition ${
                    isSelected
                      ? 'bg-rose-50/90 font-bold text-[#8B1515]'
                      : 'font-medium text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate">{opt.label}</p>
                    {opt.sublabel && (
                      <p className="truncate text-[10px] font-normal text-slate-400">
                        {opt.sublabel}
                      </p>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const DEFAULT_SPECIALTIES = [
  'Doctor (Poli Umum)',
  'Dokter Spesialis Bedah',
  'Dokter Spesialis Anak',
  'Dokter Spesialis Penyakit Dalam',
  'Dokter Spesialis Kandungan & Kebidanan',
  'Psikolog Klinis',
] as const;

const DAY_CHIPS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

const STATUS_OPTIONS: CustomDropdownOption[] = [
  { value: 'Available', label: 'Available', sublabel: 'Siap menerima jadwal praktik' },
  { value: 'On Duty', label: 'On Duty', sublabel: 'Sedang bertugas di rumah sakit' },
  { value: 'Break', label: 'Break', sublabel: 'Sedang istirahat / jeda layanan' },
  { value: 'Off', label: 'Off', sublabel: 'Tidak bertugas' },
];

// Gelar dokter / spesialis klinis yang valid
const DOCTOR_TITLE_PREFIX_REGEX = /(?:^|[\s,(])dr\.?(?=\s|\.|,|$)/i;
const DOCTOR_TITLE_SUFFIX_REGEX =
  /(?:,\s*|\s+)(S\.?Ked\.?|Sp\.[A-Za-z0-9.]+|drg\.?|S\.?KG\.?)(?=$|\s|,|\))/i;

// Role yang tidak diperbolehkan masuk ke daftar jadwal praktik dokter
const EXCLUDED_DOCTOR_ROLES = [
  'nurse',
  'perawat',
  'paramedic',
  'emt',
  'cadets',
  'cadet',
  'trainee',
  'intern',
  'admin',
  'hr',
  'human resources',
  'secretary',
  'treasurer',
] as const;

function hasAllowedRoleAndDoctorTitle(member: PortalStaffMember): boolean {
  const rec = member as unknown as Record<string, unknown>;
  const roleStr = String(member.role ?? rec.roleName ?? rec.jabatan ?? '')
    .trim()
    .toLowerCase();

  // Tolak jika role termasuk daftar yang dikecualikan (mis. Nurse)
  if (!roleStr || EXCLUDED_DOCTOR_ROLES.some((blocked) => roleStr.includes(blocked))) {
    return false;
  }

  const formattedName = formatStaffDisplayName(member);
  const candidateTexts = [
    formattedName,
    rec.nama,
    rec.fullName,
    rec.displayName,
    rec.gelar,
    rec.title,
    rec.degree,
  ]
    .map((val) => (typeof val === 'string' ? val.trim() : ''))
    .filter(Boolean);

  return candidateTexts.some(
    (text) => DOCTOR_TITLE_PREFIX_REGEX.test(text) || DOCTOR_TITLE_SUFFIX_REGEX.test(text)
  );
}

function extractStaffAvatar(member: PortalStaffMember | undefined): string | undefined {
  if (!member) return undefined;
  const rec = member as unknown as Record<string, unknown>;
  for (const key of ['avatarUrl', 'photoUrl', 'avatar', 'foto', 'profileUrl', 'imageUrl']) {
    const val = rec[key];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }
  return undefined;
}

function getInitials(name: string): string {
  const cleaned = name.replace(/^(dr\.?|drg\.?)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getScheduleStatusBadge(status: DoctorScheduleStatus): string {
  switch (status) {
    case 'Available':
      return 'text-emerald-600';
    case 'On Duty':
      return 'text-sky-600';
    case 'Break':
      return 'text-amber-600';
    default:
      return 'text-slate-500';
  }
}

export function JadwalPraktikDokterSection({
  activeStaffList,
  currentUser,
  schedules = [],
  onSchedulesChange,
  onPublishToPublic,
  onNotify,
}: JadwalPraktikDokterSectionProps) {
  // Reaktif terhadap perubahan gelar maupun role staf
  const eligibleDoctors = useMemo(
    () => activeStaffList.filter((stf) => hasAllowedRoleAndDoctorTitle(stf)),
    [activeStaffList]
  );

  const doctorDropdownOptions = useMemo<CustomDropdownOption[]>(
    () =>
      eligibleDoctors.map((doc) => ({
        value: doc.uid,
        label: `${formatStaffDisplayName(doc)} (${doc.role})`,
        sublabel: doc.divisi ? `Divisi ${doc.divisi}` : undefined,
      })),
    [eligibleDoctors]
  );

  const specialtyDropdownOptions = useMemo<CustomDropdownOption[]>(() => {
    const set = new Set<string>(DEFAULT_SPECIALTIES);
    for (const stf of eligibleDoctors) {
      if (stf.role && stf.divisi) {
        set.add(`${stf.role} (${stf.divisi})`);
      } else if (stf.role) {
        set.add(stf.role);
      }
    }
    return Array.from(set).map((spec) => ({
      value: spec,
      label: spec,
    }));
  }, [eligibleDoctors]);

  const [selectedStaffUid, setSelectedStaffUid] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>(
    () => specialtyDropdownOptions[0]?.value ?? 'Doctor (Poli Umum)'
  );
  const [daysLabel, setDaysLabel] = useState<string>('Senin, Rabu, Jumat');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('15:00');
  const [status, setStatus] = useState<DoctorScheduleStatus>('Available');

  const [localSchedules, setLocalSchedules] = useState<DoctorPracticeScheduleItem[]>(schedules);

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  // Jika gelar hilang atau role berubah jadi tidak sesuai, langsung keluar dari pilihan aktif
  useEffect(() => {
    if (eligibleDoctors.length === 0) {
      if (selectedStaffUid) {
        setSelectedStaffUid('');
      }
      return;
    }

    const stillEligible = eligibleDoctors.some((d) => d.uid === selectedStaffUid);
    if (!stillEligible) {
      const preferred =
        currentUser && eligibleDoctors.some((d) => d.uid === currentUser.uid)
          ? currentUser.uid
          : eligibleDoctors[0].uid;
      setSelectedStaffUid(preferred);
    }
  }, [eligibleDoctors, selectedStaffUid, currentUser]);

  const commitSchedules = (next: DoctorPracticeScheduleItem[]) => {
    setLocalSchedules(next);
    onSchedulesChange?.(next);
  };

  const toggleDayInInput = (day: string) => {
    const currentList = daysLabel
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const exists = currentList.some((d) => d.toLowerCase() === day.toLowerCase());
    const nextList = exists
      ? currentList.filter((d) => d.toLowerCase() !== day.toLowerCase())
      : [...currentList, day];
    setDaysLabel(nextList.join(', '));
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = eligibleDoctors.find((d) => d.uid === selectedStaffUid);
    const cleanDays = daysLabel.trim();

    if (!targetStaff || !cleanDays || !startTime || !endTime) {
      onNotify?.('Pilih dokter dengan gelar dan role yang sesuai serta lengkapi data jadwal.');
      return;
    }

    const doctorDisplayName = formatStaffDisplayName(targetStaff);
    const avatarUrl = extractStaffAvatar(targetStaff);

    const newItem: DoctorPracticeScheduleItem = {
      id: `doc-sched-${Date.now()}`,
      staffUid: targetStaff.uid,
      doctorName: doctorDisplayName,
      specialty: specialty.trim() || targetStaff.role || 'Doctor',
      daysLabel: cleanDays,
      startTime,
      endTime,
      status,
      avatarUrl,
    };

    const updated = [newItem, ...localSchedules];
    commitSchedules(updated);
    onPublishToPublic?.(newItem);
    onNotify?.(`Jadwal praktik ${doctorDisplayName} disimpan dan tampil di Halaman Publik.`);
  };

  const handleRemoveSchedule = (id: string) => {
    const updated = localSchedules.filter((item) => item.id !== id);
    commitSchedules(updated);
    onNotify?.('Jadwal praktik dokter dihapus.');
  };

  const activeDayTokens = useMemo(
    () =>
      new Set(
        daysLabel
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean)
      ),
    [daysLabel]
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-rose-200/80 bg-white p-6 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Buat Jadwal Praktik Dokter
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Jadwal yang disimpan otomatis terhubung dan muncul pada Halaman Publik
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSchedule} className="mt-5 space-y-4 text-xs">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Pilih Dokter <span className="text-[#8B1515]">*</span>
              </label>
              <CustomSelectDropdown
                value={selectedStaffUid}
                options={doctorDropdownOptions}
                disabled={doctorDropdownOptions.length === 0}
                placeholder={
                  doctorDropdownOptions.length === 0
                    ? 'Tidak ada dokter dengan gelar & role sesuai'
                    : 'Pilih dokter...'
                }
                onChange={setSelectedStaffUid}
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Kategori / Spesialisasi <span className="text-[#8B1515]">*</span>
              </label>
              <CustomSelectDropdown
                value={specialty}
                options={specialtyDropdownOptions}
                placeholder="Pilih kategori / spesialisasi..."
                onChange={setSpecialty}
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Hari Praktik <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type="text"
                required
                value={daysLabel}
                onChange={(e) => setDaysLabel(e.target.value)}
                placeholder="Contoh: Senin, Rabu, Jumat"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {DAY_CHIPS.map((day) => {
                  const selected = activeDayTokens.has(day.toLowerCase());
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayInInput(day)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                        selected
                          ? 'bg-rose-50 text-[#8B1515] ring-1 ring-rose-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Jam Mulai <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-xs font-semibold text-slate-900 focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Jam Selesai <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-xs font-semibold text-slate-900 focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Status <span className="text-[#8B1515]">*</span>
              </label>
              <CustomSelectDropdown
                value={status}
                options={STATUS_OPTIONS}
                placeholder="Pilih status..."
                onChange={(val) => setStatus(val as DoctorScheduleStatus)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={doctorDropdownOptions.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8B1515] px-5 py-2.5 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#6E0F0F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Simpan &amp; Tampilkan di Halaman Publik</span>
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#8B1515]" />
            <h3 className="font-heading text-sm font-extrabold text-slate-900">
              Dokter dengan Jadwal Praktik Aktif ({localSchedules.length})
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            <span>Tersinkron ke Halaman Publik</span>
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {localSchedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
              Belum ada dokter yang memiliki jadwal praktik. Gunakan form di atas untuk menambahkan jadwal.
            </div>
          ) : (
            localSchedules.map((item) => (
              <div
                key={item.id}
                className="flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/15 px-4 py-3.5 transition hover:bg-rose-50/30"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.doctorName}
                      className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 font-heading text-xs font-extrabold text-[#8B1515] ring-1 ring-rose-200">
                      {getInitials(item.doctorName)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-extrabold text-slate-900">
                      {item.doctorName}
                    </p>
                    <p className="truncate text-xs font-semibold text-[#991B1B]">
                      {item.specialty} · {item.daysLabel} ({item.startTime}–{item.endTime})
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Status:</span>
                      <span className={getScheduleStatusBadge(item.status)}>{item.status}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(item.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-[#8B1515]"
                  aria-label={`Hapus jadwal ${item.doctorName}`}
                  title="Hapus jadwal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}