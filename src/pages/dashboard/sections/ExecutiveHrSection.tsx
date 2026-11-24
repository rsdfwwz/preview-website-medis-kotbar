import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  FileText,
  Paperclip,
  RotateCcw,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { RoleName } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import { BULAN_INDO, type DivisionName } from '../constants';
import type {
  DashMenu,
  DutySessionLogEntry,
  LeaveRequestItem,
  OfficialPaySlipItem,
  PortalStaffMember,
  ResignRequestItem,
  SopBookItem,
  WeekPeriodOption,
} from '../types';

const DEFAULT_DIVISIONS: DivisionName[] = [
  'IGD',
  'Bedah Plastik',
  'Psikologi',
  'Farmasi',
  'Forensik & CK',
  'Manajemen',
] as DivisionName[];

interface ExecutiveHrSectionProps {
  sectionKey: DashMenu;
  activeStaffList: PortalStaffMember[];
  pendingStaffList: PortalStaffMember[];
  onApproveAccount: (uid: string) => void;
  onRejectAccount: (uid: string) => void;
  onChangeStaffRole: (uid: string, role: RoleName) => void;
  onChangeStaffDivision: (uid: string, divisi: DivisionName) => void;
  leaveRequests: LeaveRequestItem[];
  onDecideLeave: (id: string, status: 'disetujui' | 'ditolak') => void;
  resignRequests: ResignRequestItem[];
  onDecideResign: (id: string, status: 'disetujui' | 'ditolak') => void;
  dutyLogs: DutySessionLogEntry[];
  onImportDiscordLogs: (entries: DutySessionLogEntry[]) => void;
  weekOptions: WeekPeriodOption[];
  selectedWeekId: string;
  onSelectWeekId: (weekId: string) => void;
  officialPaySlips: OfficialPaySlipItem[];
  onPublishPaySlip: (slip: OfficialPaySlipItem) => void;
  sopBooks: SopBookItem[];
  onOpenBook: (book: SopBookItem) => void;
  onAddRegulationBook: (book: SopBookItem) => void;
  onNotify: (msg: string) => void;
}

interface AttachmentPreviewModalState {
  title: string;
  fileName: string;
  mimeType?: string;
  dataUrl?: string;
}

interface ReasonModalState {
  title: string;
  subtitle: string;
  reason: string;
}

function formatTanggalIndo(ymd?: string): string {
  if (!ymd) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return ymd;
  const y = Number(match[1]);
  const mIdx = Math.max(0, Math.min(11, Number(match[2]) - 1));
  const d = Number(match[3]);
  return `${d} ${BULAN_INDO[mIdx]} ${y}`;
}

function hitungDurasiHari(startYmd: string, endYmd: string): number {
  const s = new Date(`${startYmd}T00:00:00`);
  const e = new Date(`${endYmd}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;
  const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

function extractAttachmentInfo(item: Record<string, unknown>) {
  const fileName =
    typeof item.lampiranNama === 'string' && item.lampiranNama.trim()
      ? item.lampiranNama.trim()
      : typeof item.attachmentName === 'string' && item.attachmentName.trim()
        ? item.attachmentName.trim()
        : null;

  const dataUrl =
    typeof item.lampiranDataUrl === 'string' && item.lampiranDataUrl.trim()
      ? item.lampiranDataUrl.trim()
      : typeof item.lampiranUrl === 'string' && item.lampiranUrl.trim()
        ? item.lampiranUrl.trim()
        : typeof item.lampiran === 'string' &&
            (item.lampiran.startsWith('data:') || item.lampiran.startsWith('http'))
          ? item.lampiran.trim()
          : undefined;

  const mimeType =
    typeof item.lampiranTipe === 'string'
      ? item.lampiranTipe
      : typeof item.lampiranType === 'string'
        ? item.lampiranType
        : undefined;

  const isImage =
    Boolean(mimeType?.startsWith('image/')) ||
    Boolean(dataUrl?.startsWith('data:image/')) ||
    Boolean(fileName && /\.(png|jpe?g|webp|gif)$/i.test(fileName));

  return { fileName, dataUrl, mimeType, isImage };
}

export function ExecutiveHrSection({
  sectionKey,
  activeStaffList,
  pendingStaffList,
  onApproveAccount,
  onRejectAccount,
  onChangeStaffRole,
  onChangeStaffDivision,
  leaveRequests,
  onDecideLeave,
  resignRequests,
  onDecideResign,
  dutyLogs,
  onImportDiscordLogs,
  weekOptions,
  selectedWeekId,
  onSelectWeekId,
  onPublishPaySlip,
  sopBooks,
  onOpenBook,
  onAddRegulationBook,
  onNotify,
}: ExecutiveHrSectionProps) {
  const [rawLogInput, setRawLogInput] = useState('');
  const [selectedPayrollUid, setSelectedPayrollUid] = useState<string>(
    () => activeStaffList[0]?.uid ?? ''
  );
  const [bonusInput, setBonusInput] = useState<number>(100000);
  const [tunjanganInput, setTunjanganInput] = useState<number>(50000);
  const [potonganInput, setPotonganInput] = useState<number>(0);

  const [newRegTitle, setNewRegTitle] = useState('');
  const [newRegCategory, setNewRegCategory] = useState('Regulasi Internal');
  const [newRegSummary, setNewRegSummary] = useState('');
  const [newRegBody, setNewRegBody] = useState('');

  const [leaveStatusOverrides, setLeaveStatusOverrides] = useState<
    Record<string, 'pending' | 'disetujui' | 'ditolak'>
  >({});
  const [resignStatusOverrides, setResignStatusOverrides] = useState<
    Record<string, 'pending' | 'disetujui' | 'ditolak'>
  >({});
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreviewModalState | null>(
    null
  );
  const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null);

  const divisionOptions = useMemo<DivisionName[]>(() => {
    const set = new Set<DivisionName>(DEFAULT_DIVISIONS);
    for (const stf of activeStaffList) {
      if (stf.divisi) {
        set.add(stf.divisi as DivisionName);
      }
    }
    return Array.from(set);
  }, [activeStaffList]);

  const visibleLeaveRequests = useMemo(
    () =>
      leaveRequests
        .filter((item) => !dismissedIds[item.id])
        .map((item) => {
          const override = leaveStatusOverrides[item.id];
          return override ? { ...item, status: override } : item;
        }),
    [leaveRequests, dismissedIds, leaveStatusOverrides]
  );

  const visibleResignRequests = useMemo(
    () =>
      resignRequests
        .filter((item) => !dismissedIds[item.id])
        .map((item) => {
          const override = resignStatusOverrides[item.id];
          return override ? { ...item, status: override } : item;
        }),
    [resignRequests, dismissedIds, resignStatusOverrides]
  );

  const handleLeaveDecision = (id: string, nextStatus: 'disetujui' | 'ditolak') => {
    setLeaveStatusOverrides((prev) => ({ ...prev, [id]: nextStatus }));
    onDecideLeave(id, nextStatus);
    onNotify(
      `Status cuti diperbarui menjadi ${nextStatus === 'disetujui' ? 'Approved (ACC)' : 'Rejected (Tolak)'}.`
    );
  };

  const handleResetLeaveDecision = (id: string) => {
    setLeaveStatusOverrides((prev) => ({ ...prev, [id]: 'pending' }));
    onNotify('Status cuti dikembalikan ke Pending.');
  };

  const handleResignDecision = (id: string, nextStatus: 'disetujui' | 'ditolak') => {
    setResignStatusOverrides((prev) => ({ ...prev, [id]: nextStatus }));
    onDecideResign(id, nextStatus);
    onNotify(
      `Status resign diperbarui menjadi ${nextStatus === 'disetujui' ? 'Approved (ACC)' : 'Rejected (Tolak)'}.`
    );
  };

  const handleResetResignDecision = (id: string) => {
    setResignStatusOverrides((prev) => ({ ...prev, [id]: 'pending' }));
    onNotify('Status resign dikembalikan ke Pending.');
  };

  const handleParseDiscordLogs = () => {
    const lines = rawLogInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const parsed: DutySessionLogEntry[] = lines.map((line, idx) => {
      const minuteMatch = /(\d+)\s*(?:menit|mins?|m)/i.exec(line);
      const durasiMenit = minuteMatch ? Number(minuteMatch[1]) : 60;
      const targetStaff = activeStaffList[idx % Math.max(1, activeStaffList.length)];
      return {
        id: `discord-${Date.now()}-${idx}`,
        staffUid: targetStaff?.uid ?? 'staff-1',
        namaStaffFormatted: targetStaff
          ? formatStaffDisplayName(targetStaff)
          : 'Staff Medis',
        waktuMulai: '2026-11-23 19:00',
        waktuSelesai: '2026-11-23 20:00',
        durasiMenit,
      };
    });

    onImportDiscordLogs(parsed);
    setRawLogInput('');
    onNotify(`${parsed.length} log duty berhasil diimpor.`);
  };

  const renderSectionContent = () => {
    if (sectionKey === 'pengelolaan_staff') {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            Pengelolaan Jabatan &amp; Divisi Staff
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Staff</th>
                  <th className="px-3 py-2.5">Jabatan</th>
                  <th className="px-3 py-2.5">Divisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeStaffList.map((stf) => (
                  <tr key={stf.uid}>
                    <td className="py-3 pr-4 font-bold text-slate-900">
                      {formatStaffDisplayName(stf)}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={stf.role}
                        onChange={(e) => onChangeStaffRole(stf.uid, e.target.value as RoleName)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                      >
                        <option value="Doctor">Doctor</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Paramedic">Paramedic</option>
                        <option value="Human Resources Department">
                          Human Resources Department
                        </option>
                        <option value="Deputy Director">Deputy Director</option>
                        <option value="Director">Director</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={stf.divisi}
                        onChange={(e) =>
                          onChangeStaffDivision(stf.uid, e.target.value as DivisionName)
                        }
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                      >
                        {divisionOptions.map((div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (sectionKey === 'approval_akun') {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            Approval Akun Staff Baru ({pendingStaffList.length})
          </h2>
          <div className="mt-4 space-y-3">
            {pendingStaffList.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Tidak ada permohonan akun menunggu persetujuan.
              </p>
            ) : (
              pendingStaffList.map((stf) => (
                <div
                  key={stf.uid}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 p-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{formatStaffDisplayName(stf)}</p>
                    <p className="text-slate-500">
                      {stf.role} · {stf.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onApproveAccount(stf.uid)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
                    >
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectAccount(stf.uid)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      );
    }

    if (sectionKey === 'approval_cuti') {
      const pendingCount = visibleLeaveRequests.filter((r) => r.status === 'pending').length;

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                  Approval Cuti Staff (Heads+)
                </h2>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#8B1515]">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Tinjau alasan &amp; lampiran pendukung lalu pilih ACC atau Tolak. Setelah dipilih, tersedia tombol reset dan hapus.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-3.5 py-3 text-left">NAMA &amp; NIP</th>
                  <th className="px-3.5 py-3 text-left">JENIS CUTI</th>
                  <th className="px-3.5 py-3 text-left">PERIODE &amp; DURASI</th>
                  <th className="px-3.5 py-3 text-center">ALASAN CUTI</th>
                  <th className="px-3.5 py-3 text-center">LAMPIRAN</th>
                  <th className="px-3.5 py-3 text-center">STATUS</th>
                  <th className="px-3.5 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleLeaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                      Belum ada pengajuan cuti untuk ditinjau.
                    </td>
                  </tr>
                ) : (
                  visibleLeaveRequests.map((item) => {
                    const rec = item as unknown as Record<string, unknown>;
                    const att = extractAttachmentInfo(rec);
                    const durasiHari = hitungDurasiHari(item.tanggalMulai, item.tanggalSelesai);
                    const isDecided = item.status !== 'pending';
                    const isLongReason = item.alasan.length > 48;

                    return (
                      <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                        <td className="px-3.5 py-3.5 text-left">
                          <p className="font-bold text-slate-900">{item.namaStaff}</p>
                          <p className="font-mono text-[10px] text-slate-400">
                            NIP: {item.nip || '-'}
                          </p>
                        </td>

                        <td className="px-3.5 py-3.5 text-left font-semibold text-slate-800">
                          {item.jenisCuti}
                        </td>

                        <td className="px-3.5 py-3.5 text-left">
                          <p className="font-mono text-[11px] font-semibold text-slate-800">
                            {formatTanggalIndo(item.tanggalMulai)} s/d{' '}
                            {formatTanggalIndo(item.tanggalSelesai)}
                          </p>
                          <p className="text-[10px] text-slate-400">({durasiHari} hari)</p>
                        </td>

                        <td className="w-[270px] max-w-[270px] px-3.5 py-3.5 text-center">
                          <div className="mx-auto rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 text-left text-slate-700 [overflow-wrap:anywhere]">
                            <p className="line-clamp-3 leading-relaxed">{item.alasan}</p>
                            {isLongReason && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReasonModal({
                                    title: `Alasan Cuti · ${item.namaStaff}`,
                                    subtitle: `${item.jenisCuti} · ${formatTanggalIndo(item.tanggalMulai)} s/d ${formatTanggalIndo(item.tanggalSelesai)}`,
                                    reason: item.alasan,
                                  })
                                }
                                className="mt-1.5 inline-flex items-center text-[10px] font-bold text-[#8B1515] hover:underline"
                              >
                                Baca selengkapnya
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-3.5 py-3.5 text-center">
                          {att.fileName ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAttachmentPreview({
                                  title: `Lampiran Cuti · ${item.namaStaff}`,
                                  fileName: att.fileName!,
                                  mimeType: att.mimeType,
                                  dataUrl: att.dataUrl,
                                })
                              }
                              className="mx-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-100/70"
                            >
                              {att.isImage ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <Paperclip className="h-3.5 w-3.5" />
                              )}
                              <span className="max-w-[110px] truncate">{att.fileName}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-3.5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              item.status === 'disetujui'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'ditolak'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.status === 'disetujui'
                              ? 'Approved'
                              : item.status === 'ditolak'
                                ? 'Rejected'
                                : 'Pending'}
                          </span>
                        </td>

                        <td className="px-3.5 py-3.5 text-center">
                          {!isDecided ? (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleLeaveDecision(item.id, 'disetujui')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                                title="Setujui / ACC"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>ACC</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleLeaveDecision(item.id, 'ditolak')}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-100"
                                title="Tolak pengajuan"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResetLeaveDecision(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                title="Reset ke Pending"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDismissedIds((prev) => ({ ...prev, [item.id]: true }))
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-50"
                                title="Hapus dari daftar approval"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (sectionKey === 'approval_resign') {
      const pendingCount = visibleResignRequests.filter((r) => r.status === 'pending').length;

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                  Approval Resign Staff (Heads+)
                </h2>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#8B1515]">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Periksa tanggal efektif, serah terima tugas, dan alasan resign. Setelah dipilih, tersedia tombol reset dan hapus.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-3.5 py-3 text-left">NAMA &amp; NIP</th>
                  <th className="px-3.5 py-3 text-left">TGL PENGAJUAN &amp; EFEKTIF</th>
                  <th className="px-3.5 py-3 text-center">SERAH TERIMA &amp; ALASAN</th>
                  <th className="px-3.5 py-3 text-center">LAMPIRAN</th>
                  <th className="px-3.5 py-3 text-center">STATUS</th>
                  <th className="px-3.5 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleResignRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                      Belum ada pengajuan resign untuk ditinjau.
                    </td>
                  </tr>
                ) : (
                  visibleResignRequests.map((item) => {
                    const rec = item as unknown as Record<string, unknown>;
                    const att = extractAttachmentInfo(rec);
                    const isDecided = item.status !== 'pending';
                    const isLongReason = item.alasan.length > 48;

                    return (
                      <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                        <td className="px-3.5 py-3.5 text-left">
                          <p className="font-bold text-slate-900">{item.namaStaff}</p>
                          <p className="font-mono text-[10px] text-slate-400">
                            NIP: {item.nip || '-'}
                          </p>
                        </td>

                        <td className="px-3.5 py-3.5 text-left">
                          <p className="font-mono text-[11px] font-bold text-[#8B1515]">
                            Efektif: {formatTanggalIndo(item.tanggalEfektif)}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            Diajukan: {formatTanggalIndo(item.tanggalPengajuan)}
                          </p>
                        </td>

                        <td className="w-[290px] max-w-[290px] px-3.5 py-3.5 text-center">
                          <div className="mx-auto rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 text-left [overflow-wrap:anywhere]">
                            <p className="text-[11px] font-semibold text-slate-800">
                              Serah Terima:{' '}
                              <span className="font-normal">{item.serahTerima || '-'}</span>
                            </p>
                            <p className="mt-1 line-clamp-3 leading-relaxed text-slate-600">
                              {item.alasan}
                            </p>
                            {isLongReason && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReasonModal({
                                    title: `Alasan Resign · ${item.namaStaff}`,
                                    subtitle: `Efektif: ${formatTanggalIndo(item.tanggalEfektif)}`,
                                    reason: item.alasan,
                                  })
                                }
                                className="mt-1.5 inline-flex items-center text-[10px] font-bold text-[#8B1515] hover:underline"
                              >
                                Baca selengkapnya
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-3.5 py-3.5 text-center">
                          {att.fileName ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAttachmentPreview({
                                  title: `Lampiran Resign · ${item.namaStaff}`,
                                  fileName: att.fileName!,
                                  mimeType: att.mimeType,
                                  dataUrl: att.dataUrl,
                                })
                              }
                              className="mx-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-100/70"
                            >
                              {att.isImage ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <Paperclip className="h-3.5 w-3.5" />
                              )}
                              <span className="max-w-[110px] truncate">{att.fileName}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-3.5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              item.status === 'disetujui'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'ditolak'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.status === 'disetujui'
                              ? 'Approved'
                              : item.status === 'ditolak'
                                ? 'Rejected'
                                : 'Pending'}
                          </span>
                        </td>

                        <td className="px-3.5 py-3.5 text-center">
                          {!isDecided ? (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResignDecision(item.id, 'disetujui')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                                title="Setujui / ACC"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>ACC</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResignDecision(item.id, 'ditolak')}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-100"
                                title="Tolak pengajuan"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResetResignDecision(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                title="Reset ke Pending"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDismissedIds((prev) => ({ ...prev, [item.id]: true }))
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#8B1515] transition hover:bg-rose-50"
                                title="Hapus dari daftar approval"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (sectionKey === 'discord_duty_parser') {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            Discord Duty Parser
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tempel log duty per baris untuk dikonversi menjadi sesi duty staff.
          </p>
          <textarea
            rows={5}
            value={rawLogInput}
            onChange={(e) => setRawLogInput(e.target.value)}
            placeholder="Contoh: Duty selesai durasi 120 menit..."
            className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#8B1515] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleParseDiscordLogs}
            className="mt-3 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
          >
            Proses &amp; Impor Log
          </button>
        </section>
      );
    }

    if (sectionKey === 'rekap_absensi') {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Rekap Absensi Duty Staff
            </h2>
            <select
              value={selectedWeekId}
              onChange={(e) => onSelectWeekId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold"
            >
              {weekOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.dropdownLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Staff</th>
                  <th className="px-3 py-2.5">Mulai</th>
                  <th className="px-3 py-2.5">Selesai</th>
                  <th className="px-3 py-2.5">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dutyLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 font-bold text-slate-900">
                      {log.namaStaffFormatted}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{log.waktuMulai}</td>
                    <td className="px-3 py-2.5 text-slate-600">{log.waktuSelesai ?? '-'}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#8B1515]">
                      {log.durasiMenit} mnt
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (sectionKey === 'payroll_management') {
      const targetStaff =
        activeStaffList.find((s) => s.uid === selectedPayrollUid) ?? activeStaffList[0];
      const selectedWeek = weekOptions.find((w) => w.id === selectedWeekId) ?? weekOptions[0];

      const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetStaff) return;
        const gajiPokok = 1200000;
        const takeHomePay = gajiPokok + bonusInput + tunjanganInput - potonganInput;
        const slip: OfficialPaySlipItem = {
          id: `slip-${Date.now()}`,
          staffUid: targetStaff.uid,
          namaStaff: formatStaffDisplayName(targetStaff),
          jabatan: targetStaff.role,
          periodeId: selectedWeek?.id ?? 'week-current',
          periodeLabel: selectedWeek?.shortRange ?? 'Minggu Ini',
          totalJamDuty: 12,
          gajiPokok,
          bonusDuty: bonusInput,
          tunjanganTambahan: tunjanganInput,
          potongan: potonganInput,
          takeHomePay,
          statusPembayaran: 'Paid',
          tanggalBayar: '2026-11-23',
        };
        onPublishPaySlip(slip);
      };

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            Payroll Management · Terbitkan Slip Gaji
          </h2>
          <form onSubmit={handlePublish} className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Pilih Staff</label>
              <select
                value={targetStaff?.uid ?? ''}
                onChange={(e) => setSelectedPayrollUid(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                {activeStaffList.map((stf) => (
                  <option key={stf.uid} value={stf.uid}>
                    {formatStaffDisplayName(stf)} ({stf.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Bonus Duty (Rp)</label>
              <input
                type="number"
                value={bonusInput}
                onChange={(e) => setBonusInput(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Tunjangan Tambahan (Rp)</label>
              <input
                type="number"
                value={tunjanganInput}
                onChange={(e) => setTunjanganInput(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Potongan (Rp)</label>
              <input
                type="number"
                value={potonganInput}
                onChange={(e) => setPotonganInput(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-[#8B1515] px-5 py-2.5 font-extrabold text-white hover:bg-[#6E0F0F]"
              >
                Terbitkan Slip Gaji Resmi
              </button>
            </div>
          </form>
        </section>
      );
    }

    if (sectionKey === 'regulation_management') {
      const handleCreateReg = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRegTitle.trim()) return;
        const book: SopBookItem = {
          id: `reg-${Date.now()}`,
          kodeDokumen: `REG-${Math.floor(100 + Math.random() * 900)}`,
          docType: 'regulasi',
          judul: newRegTitle.trim(),
          kategori: newRegCategory,
          ringkasan: newRegSummary.trim() || 'Dokumen regulasi internal resmi.',
          tarifKbrp: 'Wajib Dipatuhi',
          penulisPetinggi: 'Manajemen RS KotaBaru',
          tanggalUpdate: '2026-11-23',
          halaman: [newRegBody.trim() || 'Isi regulasi belum ditambahkan.'],
        };
        onAddRegulationBook(book);
        setNewRegTitle('');
        setNewRegSummary('');
        setNewRegBody('');
      };

      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Tambah Regulasi / Dokumen Baru
            </h2>
            <form onSubmit={handleCreateReg} className="mt-4 space-y-3 text-xs">
              <input
                type="text"
                required
                value={newRegTitle}
                onChange={(e) => setNewRegTitle(e.target.value)}
                placeholder="Judul regulasi..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                type="text"
                value={newRegCategory}
                onChange={(e) => setNewRegCategory(e.target.value)}
                placeholder="Kategori..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                type="text"
                value={newRegSummary}
                onChange={(e) => setNewRegSummary(e.target.value)}
                placeholder="Ringkasan singkat..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <textarea
                rows={4}
                value={newRegBody}
                onChange={(e) => setNewRegBody(e.target.value)}
                placeholder="Isi pasal / ketentuan..."
                className="w-full rounded-xl border border-slate-200 p-3"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#8B1515] px-4 py-2.5 font-extrabold text-white hover:bg-[#6E0F0F]"
              >
                Simpan Regulasi
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Daftar Dokumen Aktif ({sopBooks.length})
            </h2>
            <div className="mt-4 space-y-2.5">
              {sopBooks.map((bk) => (
                <div
                  key={bk.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 p-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{bk.judul}</p>
                    <p className="text-[11px] text-slate-500">
                      {bk.kodeDokumen} · {bk.kategori}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenBook(bk)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Buka
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h2 className="font-heading text-lg font-extrabold text-slate-900">
          Complaint Management
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Belum ada laporan keluhan internal yang perlu ditindaklanjuti saat ini.
        </p>
      </section>
    );
  };

  return (
    <>
      {renderSectionContent()}

      {reasonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setReasonModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  {reasonModal.title}
                </h3>
                <p className="font-mono text-[11px] text-slate-400">{reasonModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-left text-xs leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
              {reasonModal.reason}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {attachmentPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
          onClick={() => setAttachmentPreview(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  {attachmentPreview.title}
                </h3>
                <p className="font-mono text-[11px] text-slate-500">
                  {attachmentPreview.fileName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentPreview(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              {attachmentPreview.dataUrl &&
              (attachmentPreview.mimeType?.startsWith('image/') ||
                attachmentPreview.dataUrl.startsWith('data:image/') ||
                /\.(png|jpe?g|webp|gif)$/i.test(attachmentPreview.fileName)) ? (
                <img
                  src={attachmentPreview.dataUrl}
                  alt={attachmentPreview.fileName}
                  className="max-h-[420px] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-[#8B1515]" />
                    <div>
                      <p className="font-bold text-slate-900">{attachmentPreview.fileName}</p>
                      <p className="text-[11px] text-slate-500">
                        {attachmentPreview.dataUrl
                          ? 'Berkas terlampir tersedia.'
                          : 'Berkas hanya tercatat nama filenya pada riwayat pengajuan ini.'}
                      </p>
                    </div>
                  </div>
                  {attachmentPreview.dataUrl && (
                    <a
                      href={attachmentPreview.dataUrl}
                      download={attachmentPreview.fileName}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
                    >
                      Unduh Dokumen
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setAttachmentPreview(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}