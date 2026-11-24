import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  History,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import type { ServiceType } from '../../types';
import { formatKbrp } from '../../utils/formatters';

export interface SubmissionHistoryRecord {
  id: string;
  kodeTiket: string;
  jenisLayanan: string;
  namaWarga: string;
  citizenId: string;
  noHpIc: string;
  detailPermintaan: string;
  totalBiayaKbrp: number;
  status: string;
  createdAt: string;
}

export type NewSubmissionHistoryInput = Omit<SubmissionHistoryRecord, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

interface CustomDropdownOption {
  value: string;
  label: string;
  count?: number;
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Pilih filter...',
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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
    <div ref={containerRef} className="relative w-full sm:w-60">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-left text-xs font-bold transition ${
          open
            ? 'border-[#8B1515] text-slate-950 ring-2 ring-red-100'
            : 'border-slate-200 text-slate-800 hover:border-red-300'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-full min-w-[230px] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl ring-1 ring-slate-950/5">
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                    isSelected
                      ? 'bg-red-50 font-extrabold text-[#8B1515]'
                      : 'font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <div className="flex items-center gap-1.5">
                    {typeof opt.count === 'number' && opt.count > 0 && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          isSelected
                            ? 'bg-red-100 text-[#8B1515]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const HISTORY_STORAGE_KEY = 'rskbr_citizen_submissions_history_v1';

const COMPLETED_STATUS_KEYWORDS = [
  'selesai',
  'done',
  'completed',
  'diterima',
  'disetujui',
  'terverifikasi',
  'terbit',
];

function isCompletedSubmissionStatus(status?: string): boolean {
  const normalized = (status || '').trim().toLowerCase();
  if (!normalized) return false;
  return COMPLETED_STATUS_KEYWORDS.some((kw) => normalized.includes(kw));
}

function isCancelledSubmissionStatus(status?: string): boolean {
  const normalized = (status || '').trim().toLowerCase();
  return normalized.includes('ditolak') || normalized.includes('batal');
}

export function readLocalSubmissionRecords(): SubmissionHistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SubmissionHistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalSubmissionRecords(records: SubmissionHistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Abaikan jika storage penuh atau diblokir
  }
}

export function appendLocalSubmissionRecord(
  input: NewSubmissionHistoryInput
): SubmissionHistoryRecord {
  const current = readLocalSubmissionRecords();
  const nextRecord: SubmissionHistoryRecord = {
    id: input.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kodeTiket: input.kodeTiket,
    jenisLayanan: input.jenisLayanan,
    namaWarga: input.namaWarga,
    citizenId: input.citizenId,
    noHpIc: input.noHpIc,
    detailPermintaan: input.detailPermintaan,
    totalBiayaKbrp: input.totalBiayaKbrp,
    status: input.status || 'Menunggu Verifikasi',
    createdAt: input.createdAt || new Date().toISOString(),
  };

  const deduped = current.filter(
    (item) =>
      !(item.kodeTiket === nextRecord.kodeTiket && item.jenisLayanan === nextRecord.jenisLayanan)
  );
  const updated = [nextRecord, ...deduped];
  writeLocalSubmissionRecords(updated);
  return nextRecord;
}

export function updateLocalSubmissionStatus(
  kodeTiket: string,
  jenisLayanan: string,
  nextStatus: string
): void {
  const current = readLocalSubmissionRecords();
  const matched = current.some(
    (item) => item.kodeTiket === kodeTiket && item.jenisLayanan === jenisLayanan
  );
  if (!matched) return;
  const updated = current.map((item) =>
    item.kodeTiket === kodeTiket && item.jenisLayanan === jenisLayanan
      ? { ...item, status: nextStatus }
      : item
  );
  writeLocalSubmissionRecords(updated);
}

function formatDateTimeId(isoStr: string): string {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function renderStatusBadge(status: string) {
  const isDone = isCompletedSubmissionStatus(status);
  const isRejectedOrCancelled = isCancelledSubmissionStatus(status);

  if (isDone) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        <span>{status}</span>
      </span>
    );
  }

  if (isRejectedOrCancelled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-[#8B1515]">
        <XCircle className="h-3 w-3" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
      <Clock className="h-3 w-3" />
      <span>{status || 'Menunggu Verifikasi'}</span>
    </span>
  );
}

export function SubmissionsHistoryPage() {
  const portal = usePortal() as unknown as {
    citizenSubmissions?: Array<Record<string, unknown>>;
    submissions?: Array<Record<string, unknown>>;
    cancelCitizenService?: (ticketOrId: string) => void;
  };

  const [localRecords, setLocalRecords] = useState<SubmissionHistoryRecord[]>(() =>
    readLocalSubmissionRecords()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('Semua Layanan');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  useEffect(() => {
    const syncLocal = () => {
      setLocalRecords(readLocalSubmissionRecords());
    };
    window.addEventListener('storage', syncLocal);
    window.addEventListener('rskbr:submissions-updated', syncLocal);
    return () => {
      window.removeEventListener('storage', syncLocal);
      window.removeEventListener('rskbr:submissions-updated', syncLocal);
    };
  }, []);

  const mergedRecords = useMemo<SubmissionHistoryRecord[]>(() => {
    const contextRaw = Array.isArray(portal?.citizenSubmissions)
      ? portal.citizenSubmissions
      : Array.isArray(portal?.submissions)
        ? portal.submissions
        : [];

    const normalizedContext: SubmissionHistoryRecord[] = contextRaw.map((item, idx) => {
      const ticket = String(
        item.kodeTiket ?? item.ticket ?? item.kode_tiket ?? `RSKBR-${1000 + idx}`
      );
      const jenis = String(
        item.jenisLayanan ?? item.serviceType ?? item.layanan ?? 'Layanan Medis'
      );
      return {
        id: String(item.id ?? `ctx-${ticket}-${idx}`),
        kodeTiket: ticket,
        jenisLayanan: jenis,
        namaWarga: String(item.namaWarga ?? item.nama ?? item.citizenName ?? 'Warga Kota Baru'),
        citizenId: String(item.citizenId ?? item.citizen_id ?? 'Warga-KBR'),
        noHpIc: String(item.noHpIc ?? item.noHp ?? item.no_hp ?? '-'),
        detailPermintaan: String(
          item.detailPermintaan ?? item.detail ?? item.keluhan ?? '-'
        ),
        totalBiayaKbrp: Number(item.totalBiayaKbrp ?? item.biaya ?? item.totalBiaya ?? 0),
        status: String(item.status ?? 'Menunggu Verifikasi'),
        createdAt: String(
          item.createdAt ?? item.tanggal ?? item.timestamp ?? new Date().toISOString()
        ),
      };
    });

    const byTicket = new Map<string, SubmissionHistoryRecord>();
    for (const rec of normalizedContext) {
      byTicket.set(`${rec.kodeTiket}::${rec.jenisLayanan}`, rec);
    }
    for (const rec of localRecords) {
      const existing = byTicket.get(`${rec.kodeTiket}::${rec.jenisLayanan}`);
      byTicket.set(`${rec.kodeTiket}::${rec.jenisLayanan}`, {
        ...existing,
        ...rec,
        status: rec.status || existing?.status || 'Menunggu Verifikasi',
      });
    }

    return Array.from(byTicket.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [portal, localRecords]);

  const completedCount = useMemo(
    () => mergedRecords.filter((item) => isCompletedSubmissionStatus(item.status)).length,
    [mergedRecords]
  );

  const serviceDropdownOptions = useMemo<CustomDropdownOption[]>(() => {
    const counts = new Map<string, number>();
    for (const rec of mergedRecords) {
      counts.set(rec.jenisLayanan, (counts.get(rec.jenisLayanan) || 0) + 1);
    }

    const baseServices: ServiceType[] = [
      'Surat Kesehatan',
      'Janji Temu Poli',
      'Operasi Plastik',
      'Tes Buta Warna',
      'Tes Psikologi',
      'Klaim Benefit SKWB',
      'Karakter Kill',
      'Loket Farmasi',
    ];

    return [
      {
        value: 'Semua Layanan',
        label: 'Semua Layanan',
        count: mergedRecords.length,
      },
      ...baseServices.map((srv) => ({
        value: srv,
        label: srv,
        count: counts.get(srv) || 0,
      })),
    ];
  }, [mergedRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mergedRecords.filter((rec) => {
      const matchService =
        selectedService === 'Semua Layanan' || rec.jenisLayanan === selectedService;
      if (!matchService) return false;
      if (!q) return true;
      return (
        rec.kodeTiket.toLowerCase().includes(q) ||
        rec.namaWarga.toLowerCase().includes(q) ||
        rec.citizenId.toLowerCase().includes(q) ||
        rec.jenisLayanan.toLowerCase().includes(q) ||
        rec.detailPermintaan.toLowerCase().includes(q)
      );
    });
  }, [mergedRecords, searchQuery, selectedService]);

  const handleClearCompletedHistory = () => {
    const remaining = localRecords.filter((item) => !isCompletedSubmissionStatus(item.status));
    const removedCount = localRecords.length - remaining.length;

    if (removedCount === 0) {
      setInfoNotice(
        'Belum ada riwayat pengajuan berstatus selesai yang dapat dibersihkan. Pengajuan yang masih berjalan tetap dipertahankan.'
      );
      return;
    }

    writeLocalSubmissionRecords(remaining);
    setLocalRecords(remaining);
    window.dispatchEvent(new Event('rskbr:submissions-updated'));
    setInfoNotice(
      `${removedCount} riwayat pengajuan yang sudah selesai berhasil dibersihkan. Pengajuan yang belum selesai tetap tersimpan.`
    );
  };

  const handleCancelRecord = (rec: SubmissionHistoryRecord) => {
    try {
      if (typeof portal?.cancelCitizenService === 'function') {
        portal.cancelCitizenService(rec.kodeTiket);
      }
    } catch {
      // Abaikan jika context tidak mengimplementasikan cancel
    }

    const current = readLocalSubmissionRecords();
    const existsInLocal = current.some(
      (item) => item.kodeTiket === rec.kodeTiket && item.jenisLayanan === rec.jenisLayanan
    );

    if (existsInLocal) {
      const updated = current.map((item) =>
        item.kodeTiket === rec.kodeTiket && item.jenisLayanan === rec.jenisLayanan
          ? { ...item, status: 'Dibatalkan' }
          : item
      );
      writeLocalSubmissionRecords(updated);
      setLocalRecords(updated);
    } else {
      const cancelledRecord: SubmissionHistoryRecord = {
        ...rec,
        status: 'Dibatalkan',
      };
      const updated = [cancelledRecord, ...current];
      writeLocalSubmissionRecords(updated);
      setLocalRecords(updated);
    }

    window.dispatchEvent(new Event('rskbr:submissions-updated'));
    setConfirmCancelId(null);
    setInfoNotice(`Pengajuan dengan tiket ${rec.kodeTiket} telah dibatalkan.`);
  };

  const handleCopyTicket = (id: string, ticket: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticket).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              to="/layanan"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B1515] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Loket Pelayanan Medis</span>
            </Link>
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
                  Riwayat Pengajuan Layanan Warga
                </h1>
                <p className="text-xs text-slate-500">
                  Daftar tiket &amp; pengajuan layanan yang telah dicatat di perangkat Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearCompletedHistory}
              disabled={completedCount === 0}
              title={
                completedCount > 0
                  ? `Bersihkan ${completedCount} riwayat yang sudah selesai`
                  : 'Hanya berlaku untuk riwayat yang sudah selesai'
              }
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                completedCount > 0
                  ? 'border-red-200 bg-white text-[#8B1515] hover:bg-red-50'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                Bersihkan Riwayat Selesai{completedCount > 0 ? ` (${completedCount})` : ''}
              </span>
            </button>

            <Link
              to="/layanan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ajukan Layanan Baru</span>
            </Link>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          Catatan: Tombol <strong>Bersihkan Riwayat Selesai</strong> hanya menghapus pengajuan yang
          statusnya sudah selesai/terverifikasi.
        </p>

        {infoNotice && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-2xs">
            <span>{infoNotice}</span>
            <button
              type="button"
              onClick={() => setInfoNotice(null)}
              className="font-bold text-[#8B1515] hover:underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter & Pencarian */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor tiket, nama warga, citizen ID, atau jenis layanan..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-xs focus:border-[#8B1515] focus:outline-none sm:text-sm"
            />
          </div>

          <CustomDropdown
            value={selectedService}
            onChange={setSelectedService}
            options={serviceDropdownOptions}
          />
        </div>

        {/* Daftar Riwayat */}
        {filteredRecords.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="mt-3 font-heading text-base font-extrabold text-slate-900">
              Belum Ada Riwayat Pengajuan
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Pengajuan layanan yang Anda kirimkan di Loket Pelayanan Medis Warga akan muncul di
              halaman ini lengkap dengan nomor tiketnya.
            </p>
            <Link
              to="/layanan"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#6D0E0E]"
            >
              <span>Buka Loket Layanan</span>
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredRecords.map((rec) => {
              const isCopied = copiedId === rec.id;
              const canCancel =
                !isCompletedSubmissionStatus(rec.status) &&
                !isCancelledSubmissionStatus(rec.status);
              const isConfirmingThis = confirmCancelId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-red-200 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-red-50 px-2.5 py-1 font-mono text-xs font-extrabold text-[#8B1515]">
                          {rec.kodeTiket}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {rec.jenisLayanan}
                        </span>
                        {renderStatusBadge(rec.status)}
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Dicatat pada {formatDateTimeId(rec.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {rec.totalBiayaKbrp > 0 ? formatKbrp(rec.totalBiayaKbrp) : 'GRATIS'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyTicket(rec.id, rec.kodeTiket)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            <span>Salin Tiket</span>
                          </>
                        )}
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmCancelId(isConfirmingThis ? null : rec.id)
                          }
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-[#8B1515] transition hover:bg-red-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Batalkan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {canCancel && isConfirmingThis && (
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-red-200 bg-red-50/75 px-4 py-3 text-xs text-[#8B1515]">
                      <span className="font-semibold">
                        Batalkan pengajuan <strong>{rec.kodeTiket}</strong> ({rec.namaWarga})?
                        Gunakan jika terjadi kesalahan pengisian form.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(null)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelRecord(rec)}
                          className="rounded-xl bg-[#8B1515] px-3.5 py-1 text-xs font-bold text-white hover:bg-[#6D0E0E]"
                        >
                          Ya, Batalkan Pengajuan
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Nama Warga</p>
                      <p className="mt-0.5 font-bold text-slate-900">{rec.namaWarga}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Citizen ID / Identitas
                      </p>
                      <p className="mt-0.5 font-mono font-semibold text-slate-700">
                        {rec.citizenId}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Kontak / No HP IC
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-700">{rec.noHpIc}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    <span className="font-bold text-slate-800">Rincian: </span>
                    <span>{rec.detailPermintaan}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmissionsHistoryPage;