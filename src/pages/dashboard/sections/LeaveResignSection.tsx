import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatStaffDisplayName } from '@/utils/formatters';
import { BULAN_INDO } from '../constants';
import type {
  LeaveRequestItem,
  PortalStaffMember,
  ResignRequestItem,
} from '../types';
import { toIsoDate } from '../utils';

interface LeaveResignSectionProps {
  mode: 'cuti' | 'resign';
  currentUser: PortalStaffMember;
  leaveRequests: LeaveRequestItem[];
  onSubmitLeave: (item: LeaveRequestItem) => void;
  resignRequests: ResignRequestItem[];
  onSubmitResign: (item: ResignRequestItem) => void;
}

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const JENIS_CUTI_OPTIONS = [
  { value: 'Cuti Tahunan', desc: 'Cuti terencana sesuai jadwal dinas' },
  { value: 'Cuti Sakit', desc: 'Pemulihan kesehatan / surat keterangan sakit' },
  { value: 'Keperluan Keluarga / Darurat', desc: 'Urusan keluarga mendesak' },
  { value: 'Izin Khusus', desc: 'Izin resmi di luar cuti reguler' },
] as const;

function formatTanggalIndo(ymd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return ymd;
  const year = Number(match[1]);
  const monthIdx = Math.max(0, Math.min(11, Number(match[2]) - 1));
  const day = Number(match[3]);
  return `${day} ${BULAN_INDO[monthIdx]} ${year}`;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getLampiranNama(item: unknown): string | null {
  if (!item || typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;
  if (typeof rec.lampiranNama === 'string' && rec.lampiranNama.trim()) {
    return rec.lampiranNama.trim();
  }
  if (typeof rec.attachmentName === 'string' && rec.attachmentName.trim()) {
    return rec.attachmentName.trim();
  }
  return null;
}

function getStatusBadgeClass(
  status: LeaveRequestItem['status'] | ResignRequestItem['status']
): string {
  switch (status) {
    case 'disetujui':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70';
    case 'ditolak':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70';
    default:
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70';
  }
}

function getStatusLabel(
  status: LeaveRequestItem['status'] | ResignRequestItem['status']
): string {
  switch (status) {
    case 'disetujui':
      return 'Disetujui';
    case 'ditolak':
      return 'Ditolak';
    default:
      return 'Menunggu';
  }
}

interface CustomLeaveTypeDropdownProps {
  value: string;
  onChange: (nextVal: string) => void;
}

function CustomLeaveTypeDropdown({ value, onChange }: CustomLeaveTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const activeOption =
    JENIS_CUTI_OPTIONS.find((opt) => opt.value === value) ?? JENIS_CUTI_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-xs font-semibold text-slate-800 transition hover:border-[#8B1515] focus:border-[#8B1515] focus:outline-none"
      >
        <span className="truncate">{activeOption.value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {JENIS_CUTI_OPTIONS.map((opt) => {
            const isSelected = opt.value === activeOption.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                  isSelected
                    ? 'bg-rose-50 text-[#8B1515]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{opt.value}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CustomDatePickerProps {
  valueYmd: string;
  minYmd?: string;
  onChangeYmd: (ymd: string) => void;
  ariaLabel?: string;
}

function CustomDatePicker({
  valueYmd,
  minYmd,
  onChangeYmd,
  ariaLabel,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueYmd);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(2026, 10, 24);
  }, [valueYmd]);

  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());

  useEffect(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

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

  const applyOffsetFromBase = (offsetDays: number) => {
    const base = minYmd ? new Date(`${minYmd}T12:00:00`) : new Date();
    const target = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + offsetDays
    );
    const ymd = toIsoDate(target);
    if (minYmd && ymd < minYmd) return;
    onChangeYmd(ymd);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-xs font-semibold text-slate-800 transition hover:border-[#8B1515] focus:border-[#8B1515] focus:outline-none"
      >
        <span className="truncate font-mono text-xs font-bold text-slate-800">
          {formatTanggalIndo(valueYmd)}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-72 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
          <div className="flex flex-wrap items-center gap-1.5 pb-2.5">
            {[
              { label: minYmd ? 'Sama' : 'Hari Ini', offset: 0 },
              { label: '+1 Hari', offset: 1 },
              { label: '+3 Hari', offset: 3 },
              { label: '+7 Hari', offset: 7 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => applyOffsetFromBase(chip.offset)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#8B1515]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
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

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase text-slate-400">
            {HARI_SINGKAT.map((h) => (
              <span key={h} className="py-1">
                {h}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
            {cells.map((cell, idx) => {
              if (!cell.day || !cell.ymd) {
                return <span key={`blank-${idx}`} className="h-7" />;
              }
              const disabled = Boolean(minYmd && cell.ymd < minYmd);
              const isSelected = cell.ymd === valueYmd;
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChangeYmd(cell.ymd!);
                    setOpen(false);
                  }}
                  className={`flex h-7 w-full items-center justify-center rounded-lg font-mono text-xs font-bold transition ${
                    disabled
                      ? 'cursor-not-allowed text-slate-300'
                      : isSelected
                        ? 'bg-[#8B1515] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-rose-50 hover:text-[#8B1515]'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface AttachmentMeta {
  name: string;
  mimeType: string;
  sizeLabel: string;
  isImage: boolean;
  dataUrl: string | null;
}

interface CustomAttachmentPickerProps {
  pickerKey: number;
  attachment: AttachmentMeta | null;
  onSelectFile: (file: File | null) => void;
}

function CustomAttachmentPicker({
  pickerKey,
  attachment,
  onSelectFile,
}: CustomAttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const chosen = files && files.length > 0 ? files[0] : null;
    onSelectFile(chosen);
  };

  return (
    <div key={pickerKey}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="sr-only"
      />

      {!attachment ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed px-3.5 py-2.5 transition ${
            dragging
              ? 'border-[#8B1515] bg-rose-50/70'
              : 'border-slate-300 bg-slate-50/40 hover:border-[#8B1515] hover:bg-rose-50/30'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#8B1515] shadow-2xs ring-1 ring-slate-200/80">
              <Paperclip className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-700">
                Pilih atau seret file lampiran
              </p>
              <p className="text-[10px] text-slate-400">
                PNG, JPG, PDF, atau DOC · Opsional
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
            <Upload className="h-3 w-3 text-[#8B1515]" />
            <span>Unggah</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/80 bg-rose-50/30 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {attachment.isImage && attachment.dataUrl ? (
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#8B1515] ring-1 ring-rose-200">
                <FileText className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{attachment.name}</p>
              <p className="font-mono text-[10px] text-slate-500">{attachment.sizeLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectFile(null)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-[#8B1515] transition hover:bg-rose-100"
            aria-label="Hapus lampiran"
            title="Hapus lampiran"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function LeaveResignSection({
  mode,
  currentUser,
  leaveRequests,
  onSubmitLeave,
  resignRequests,
  onSubmitResign,
}: LeaveResignSectionProps) {
  const isLeave = mode === 'cuti';

  const [jenisCuti, setJenisCuti] = useState<string>('Cuti Tahunan');
  const [tanggalMulai, setTanggalMulai] = useState<string>('2026-11-24');
  const [tanggalSelesai, setTanggalSelesai] = useState<string>('2026-11-26');
  const [tanggalEfektifResign, setTanggalEfektifResign] = useState<string>('2026-12-01');
  const [serahTerima, setSerahTerima] = useState<string>('');
  const [alasan, setAlasan] = useState<string>('');
  const [attachment, setAttachment] = useState<AttachmentMeta | null>(null);
  const [pickerKey, setPickerKey] = useState<number>(0);
  const [deletedHistoryIds, setDeletedHistoryIds] = useState<Record<string, boolean>>({});

  const handleStartDateChange = (nextStart: string) => {
    setTanggalMulai(nextStart);
    if (tanggalSelesai < nextStart) {
      setTanggalSelesai(nextStart);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setAttachment(null);
      setPickerKey((k) => k + 1);
      return;
    }
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeLabel: formatFileSize(file.size),
        isImage,
        dataUrl: typeof reader.result === 'string' ? reader.result : null,
      });
    };
    reader.readAsDataURL(file);
  };

  const resetFormAfterSubmit = () => {
    setSerahTerima('');
    setAlasan('');
    setAttachment(null);
    setPickerKey((k) => k + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = alasan.trim();
    if (!cleanReason) return;

    const namaLengkap = formatStaffDisplayName(currentUser);
    const staffNip = currentUser.nip ?? '';
    const todayIso = toIsoDate(new Date());

    if (isLeave) {
      const item: LeaveRequestItem = {
        id: `leave-${Date.now()}`,
        staffUid: currentUser.uid,
        namaStaff: namaLengkap,
        nip: staffNip,
        jenisCuti,
        tanggalMulai,
        tanggalSelesai: tanggalSelesai < tanggalMulai ? tanggalMulai : tanggalSelesai,
        alasan: cleanReason,
        lampiranNama: attachment?.name,
        lampiranDataUrl: attachment?.dataUrl ?? undefined,
        lampiranTipe: attachment?.mimeType,
        status: 'pending',
      } as LeaveRequestItem;
      onSubmitLeave(item);
    } else {
      const cleanHandover =
        serahTerima.trim() ||
        (attachment ? `Lampiran: ${attachment.name}` : 'Serah terima tugas standar');

      const item: ResignRequestItem = {
        id: `resign-${Date.now()}`,
        staffUid: currentUser.uid,
        namaStaff: namaLengkap,
        nip: staffNip,
        tanggalPengajuan: todayIso,
        tanggalEfektif: tanggalEfektifResign,
        alasan: cleanReason,
        serahTerima: cleanHandover,
        lampiranNama: attachment?.name,
        lampiranDataUrl: attachment?.dataUrl ?? undefined,
        lampiranTipe: attachment?.mimeType,
        status: 'pending',
      } as ResignRequestItem;
      onSubmitResign(item);
    }

    resetFormAfterSubmit();
  };

  const myLeaveHistory = useMemo(
    () =>
      leaveRequests.filter(
        (r) => r.staffUid === currentUser.uid && !deletedHistoryIds[r.id]
      ),
    [leaveRequests, currentUser.uid, deletedHistoryIds]
  );

  const myResignHistory = useMemo(
    () =>
      resignRequests.filter(
        (r) => r.staffUid === currentUser.uid && !deletedHistoryIds[r.id]
      ),
    [resignRequests, currentUser.uid, deletedHistoryIds]
  );

  const handleDeleteDecidedItem = (id: string) => {
    setDeletedHistoryIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h2 className="font-heading text-lg font-extrabold text-slate-900">
          {isLeave ? 'Form Pengajuan Cuti' : 'Form Pengajuan Resign'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {isLeave
            ? 'Ajukan izin cuti atau keperluan dinas untuk ditinjau HRD / Petinggi.'
            : 'Ajukan pengunduran diri resmi beserta tanggal efektif terakhir bertugas.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {isLeave ? (
            <>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">Jenis Cuti</label>
                <CustomLeaveTypeDropdown value={jenisCuti} onChange={setJenisCuti} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">Tanggal Mulai</label>
                  <CustomDatePicker
                    ariaLabel="Tanggal Mulai Cuti"
                    valueYmd={tanggalMulai}
                    onChangeYmd={handleStartDateChange}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">Tanggal Selesai</label>
                  <CustomDatePicker
                    ariaLabel="Tanggal Selesai Cuti"
                    valueYmd={tanggalSelesai}
                    minYmd={tanggalMulai}
                    onChangeYmd={setTanggalSelesai}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Tanggal Efektif Resign
                </label>
                <CustomDatePicker
                  ariaLabel="Tanggal Efektif Resign"
                  valueYmd={tanggalEfektifResign}
                  onChangeYmd={setTanggalEfektifResign}
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Rencana Serah Terima Tugas
                </label>
                <input
                  type="text"
                  value={serahTerima}
                  onChange={(e) => setSerahTerima(e.target.value)}
                  placeholder="Contoh: Serah terima shift & inventaris medis ke rekan divisi..."
                  className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block font-bold text-slate-700">
              {isLeave ? 'Alasan Cuti *' : 'Alasan Resign *'}
            </label>
            <textarea
              rows={3}
              required
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder={
                isLeave
                  ? 'Tuliskan alasan pengajuan cuti...'
                  : 'Tuliskan alasan pengunduran diri secara jelas...'
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-bold text-slate-700">
              Lampiran Pendukung (Opsional)
            </label>
            <CustomAttachmentPicker
              pickerKey={pickerKey}
              attachment={attachment}
              onSelectFile={handleFileSelect}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#8B1515] py-3 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#6E0F0F]"
          >
            {isLeave ? 'Kirim Pengajuan Cuti' : 'Kirim Pengajuan Resign'}
          </button>
        </form>
      </section>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            {isLeave ? 'Riwayat Pengajuan Cuti Saya' : 'Riwayat Pengajuan Resign Saya'}
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-600">
            {isLeave ? myLeaveHistory.length : myResignHistory.length}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {isLeave ? (
            myLeaveHistory.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">
                Belum ada pengajuan cuti.
              </p>
            ) : (
              myLeaveHistory.map((item) => {
                const canDelete = item.status !== 'pending';
                const lampiranNama = getLampiranNama(item);
                return (
                  <div
                    key={item.id}
                    className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-left text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{item.jenisCuti}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDecidedItem(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-50"
                            title="Hapus riwayat pengajuan"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {formatTanggalIndo(item.tanggalMulai)} s/d{' '}
                      {formatTanggalIndo(item.tanggalSelesai)}
                    </p>

                    <div className="mt-3 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5 text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Alasan
                      </p>
                      <p className="mt-1 text-slate-700 [overflow-wrap:anywhere]">
                        {item.alasan}
                      </p>
                    </div>

                    <div className="mt-2.5 text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Lampiran
                      </p>
                      {lampiranNama ? (
                        <span className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#8B1515]">
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="truncate">{lampiranNama}</span>
                        </span>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-400">-</p>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : myResignHistory.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">
              Belum ada pengajuan resign.
            </p>
          ) : (
            myResignHistory.map((item) => {
              const canDelete = item.status !== 'pending';
              const lampiranNama = getLampiranNama(item);
              return (
                <div
                  key={item.id}
                  className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-left text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Efektif: {formatTanggalIndo(item.tanggalEfektif)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDecidedItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-50"
                          title="Hapus riwayat pengajuan"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 font-mono text-[10px] text-slate-400 [overflow-wrap:anywhere]">
                    Diajukan: {formatTanggalIndo(item.tanggalPengajuan)} · Serah Terima:{' '}
                    {item.serahTerima}
                  </p>

                  <div className="mt-3 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5 text-left">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Alasan
                    </p>
                    <p className="mt-1 text-slate-700 [overflow-wrap:anywhere]">
                      {item.alasan}
                    </p>
                  </div>

                  <div className="mt-2.5 text-left">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Lampiran
                    </p>
                    {lampiranNama ? (
                      <span className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#8B1515]">
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lampiranNama}</span>
                      </span>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-400">-</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}