import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Pill,
  Scale,
  ShieldCheck,
  Skull,
  Sparkles,
  Stethoscope,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Vote,
  Wallet,
  X,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { ROLE_LEVELS, type RoleName } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import { SopBookModal } from './components/SopBookModal';
import { type DivisionName, MENU_TITLES } from './constants';
import { BenefitSkwbSection } from './sections/BenefitSkwbSection';
import { DaftarKematianSection } from './sections/DaftarKematianSection';
import { DashboardOverviewSection } from './sections/DashboardOverviewSection';
import { DataJanjiTemuSection } from './sections/DataJanjiTemuSection';
import { ExecutiveHrSection } from './sections/ExecutiveHrSection';
import { HasilTesPsikologiSection } from './sections/HasilPsikologiSection';
import { HasilSksSection } from './sections/HasilSksSection';
import { HasilTesButaWarnaSection } from './sections/HasilTesButaWarnaSection';
import { InternalVotingSection } from './sections/InternalVotingSection';
import {
  JadwalPraktikDokterSection,
  type DoctorPracticeScheduleItem,
} from './sections/JadwalPraktikDokterSection';
import { LeaveResignSection } from './sections/LeaveResignSection';
import { LoketFarmasiSection } from './sections/LoketFarmasiSection';
import { MySalarySection } from './sections/MySalarySection';
import { OfficialLetterGenerator } from './sections/OfficialLetterGenerator';
import { PengajuanOperasiPlastikSection } from './sections/PengajuanOperasiPlastikSection';
import { ProfileSecuritySection } from './sections/ProfileSecuritySection';
import { SopMedisSection } from './sections/SopMedisSection';
import { StaffDirectorySection } from './sections/StaffDirectorySection';
import type {
  DashMenu,
  DutySessionLogEntry,
  LeaveRequestItem,
  OfficialPaySlipItem,
  PortalStaffMember,
  ResignRequestItem,
  SopBookItem,
  VoteTopic,
  WeekPeriodOption,
} from './types';
import {
  formatWeekRangeLabel,
  getMondayOfWeek,
  getTargetJamMingguan,
  parseLogDate,
  toIsoDate,
} from './utils';

interface DashboardPageProps {
  onOpenPublicPage?: () => void;
  publicPath?: string;
  logoSrc?: string;
}

interface NotificationLogItem {
  id: string;
  message: string;
  timeLabel: string;
  read: boolean;
}

const INITIAL_SOP_BOOKS: SopBookItem[] = [
  {
    id: 'sop-1',
    kodeDokumen: 'SOP-MED-01',
    docType: 'sop',
    judul: 'Prosedur Triage & Penanganan IGD',
    kategori: 'Gawat Darurat',
    ringkasan:
      'Panduan klasifikasi pasien gawat darurat, stabilisasi awal, serta prioritas evakuasi ke ruang tindakan.',
    tarifKbrp: 'SOP Utama',
    penulisPetinggi: 'dr. Levi Vance Harrington, S.Ked',
    tanggalUpdate: '2026-11-10',
    halaman: [
      '1. Penilaian Primer (ABCDE)\nPastikan jalan napas (Airway) terbuka, pernapasan (Breathing) adekuat, dan sirkulasi (Circulation) stabil sebelum tindakan lanjutan.',
      '2. Klasifikasi Prioritas\nKasus merah ditangani segera di ruang resusitasi, kuning di observasi ketat, dan hijau di poliklinik.',
    ],
  },
  {
    id: 'reg-1',
    kodeDokumen: 'REG-RSKB-01',
    docType: 'regulasi',
    judul: 'Tata Tertib & Disiplin Duty Personel',
    kategori: 'Regulasi Internal',
    ringkasan:
      'Ketentuan jam duty mingguan, penggunaan atribut medis resmi, dan etika komunikasi internal.',
    tarifKbrp: 'Wajib Dipatuhi',
    penulisPetinggi: 'Yuzuriha M Bimantara',
    tanggalUpdate: '2026-11-12',
    halaman: [
      'Setiap personel medis wajib menggunakan seragam dinas lengkap saat bertugas dan mencatat log duty dengan benar.',
    ],
  },
];

const INITIAL_VOTES: VoteTopic[] = [
  {
    id: 'vote-1',
    judul: 'Penjadwalan Briefing Operasional Mingguan',
    deskripsi: 'Pemilihan slot waktu briefing rutin seluruh divisi RS KotaBaru.',
    batasWaktu: '2026-11-30',
    opsi: [
      { id: 'o-1', label: 'Jumat · 20:00 WIB', suara: 12 },
      { id: 'o-2', label: 'Sabtu · 19:30 WIB', suara: 8 },
    ],
  },
];

const HR_EXECUTIVE_MENUS: ReadonlySet<DashMenu> = new Set<DashMenu>([
  'pengelolaan_staff',
  'approval_akun',
  'approval_cuti',
  'approval_resign',
  'complaint_management',
  'discord_duty_parser',
  'rekap_absensi',
  'payroll_management',
  'regulation_management',
  'pembuatan_surat',
]);

const PETINGGI_ROLES = [
  'human resources department',
  'secretary & treasurer',
  'secretary and treasurer',
  'deputy director',
  'director',
  'hospital comitee',
  'hospital committee',
] as const;

function extractNumericLevel(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const match = /(?:lv\.?|level\s*)(\d+)/i.exec(val) ?? /^(\d+)$/.exec(val.trim());
    if (match) return Number(match[1]);
  }
  return 0;
}

function isPetinggiRole(user?: PortalStaffMember | null): boolean {
  if (!user) return false;
  const rec = user as unknown as Record<string, unknown>;

  const roleCandidates = [
    user.role,
    rec.roleName,
    rec.staffRole,
    rec.jabatan,
    rec.rank,
    rec.roleId,
    rec.roleKey,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);

  for (const r of roleCandidates) {
    const mapped =
      (ROLE_LEVELS as Record<string, number | undefined>)[r] ??
      (ROLE_LEVELS as Record<string, number | undefined>)[r.toLowerCase()];
    if (typeof mapped === 'number' && mapped >= 8) {
      return true;
    }
    if (extractNumericLevel(r) >= 8) {
      return true;
    }
  }

  const extraLevel = Math.max(extractNumericLevel(rec.roleLevel), extractNumericLevel(rec.level));
  if (extraLevel >= 8) return true;

  const combined = roleCandidates.join(' ').toLowerCase();
  return PETINGGI_ROLES.some((p) => combined.includes(p));
}

function formatNowTimeLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

export function DashboardPage({
  onOpenPublicPage,
  publicPath = '/',
  logoSrc = '/logo.png',
}: DashboardPageProps) {
  const portal = usePortal();
  const currentUser = portal.currentUser;
  const staffList = portal.staffList ?? [];

  const [activeMenu, setActiveMenu] = useState<DashMenu>('dashboard_leaderboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationLogItem[]>([
    {
      id: 'notif-welcome',
      message: 'Portal Staff & HR RS KotaBaru siap digunakan.',
      timeLabel: 'Hari ini',
      read: true,
    },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notifOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message: msg,
        timeLabel: formatNowTimeLabel(),
        read: false,
      },
      ...prev.slice(0, 29),
    ]);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleMarkAllNotifRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setToastMessage('Semua notifikasi terbaru sudah terbaca.');
    setTimeout(() => {
      setToastMessage((prev) =>
        prev === 'Semua notifikasi terbaru sudah terbaca.' ? null : prev
      );
    }, 3000);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setNotifOpen(false);
  };

  const handleOpenPublicPage = () => {
    setSidebarOpen(false);

    if (typeof onOpenPublicPage === 'function') {
      onOpenPublicPage();
      return;
    }

    const ctx = portal as unknown as {
      openPublicPage?: () => void;
      goToPublic?: () => void;
      setActivePage?: (page: string) => void;
      setView?: (view: string) => void;
      navigate?: (path: string) => void;
    };

    if (typeof ctx.openPublicPage === 'function') {
      ctx.openPublicPage();
      return;
    }
    if (typeof ctx.goToPublic === 'function') {
      ctx.goToPublic();
      return;
    }
    if (typeof ctx.setActivePage === 'function') {
      ctx.setActivePage('public');
      return;
    }
    if (typeof ctx.setView === 'function') {
      ctx.setView('public');
      return;
    }
    if (typeof ctx.navigate === 'function') {
      ctx.navigate(publicPath);
      return;
    }

    if (typeof window !== 'undefined') {
      if (window.location.hash && window.location.hash !== '#/') {
        window.location.hash = '#/';
      } else {
        window.location.assign(publicPath);
      }
    }
  };

  const handleLogout = () => {
    const ctx = portal as unknown as { logout?: () => void };
    if (typeof ctx.logout === 'function') {
      ctx.logout();
    } else {
      showToast('Sesi keluar dipicu.');
    }
  };

  const [staffOverrides, setStaffOverrides] = useState<
    Record<
      string,
      { role?: RoleName; divisi?: DivisionName; status?: 'active' | 'pending' | 'rejected' }
    >
  >({});
  const [selectedStaffModal, setSelectedStaffModal] = useState<PortalStaffMember | null>(null);

  const [dutyLogs, setDutyLogs] = useState<DutySessionLogEntry[]>(() =>
    staffList.slice(0, 5).map((stf, idx) => ({
      id: `init-log-${stf.uid}`,
      staffUid: stf.uid,
      namaStaffFormatted: formatStaffDisplayName(stf),
      waktuMulai: '2026-11-20 18:00',
      waktuSelesai: '2026-11-20 20:30',
      durasiMenit: 150 + idx * 30,
    }))
  );

  const [officialPaySlips, setOfficialPaySlips] = useState<OfficialPaySlipItem[]>(() =>
    currentUser
      ? [
          {
            id: 'slip-init-1',
            staffUid: currentUser.uid,
            namaStaff: formatStaffDisplayName(currentUser),
            jabatan: currentUser.role,
            periodeId: 'week-prev',
            periodeLabel: '16 – 22 Nov 2026',
            totalJamDuty: 12.5,
            gajiPokok: 1250000,
            bonusDuty: 150000,
            tunjanganTambahan: 50000,
            potongan: 0,
            takeHomePay: 1450000,
            statusPembayaran: 'Paid',
            tanggalBayar: '2026-11-22',
          },
        ]
      : []
  );

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [resignRequests, setResignRequests] = useState<ResignRequestItem[]>([]);
  const [votes, setVotes] = useState<VoteTopic[]>(INITIAL_VOTES);
  const [votedIds, setVotedIds] = useState<Record<string, string>>({});
  const [sopBooks, setSopBooks] = useState<SopBookItem[]>(INITIAL_SOP_BOOKS);
  const [activeBookModal, setActiveBookModal] = useState<SopBookItem | null>(null);
  const [activeBookPage, setActiveBookPage] = useState<number>(0);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorPracticeScheduleItem[]>([]);

  const weekOptions = useMemo<WeekPeriodOption[]>(() => {
    const currentMonday = getMondayOfWeek(new Date(2026, 10, 23));
    return Array.from({ length: 4 }, (_, idx) => {
      const start = new Date(currentMonday);
      start.setDate(currentMonday.getDate() - idx * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const shortRange = formatWeekRangeLabel(start, end);
      return {
        id: `week-${toIsoDate(start)}`,
        startDate: start,
        endDate: end,
        shortRange,
        dropdownLabel: idx === 0 ? `${shortRange} (Minggu Ini)` : shortRange,
        badgeLabel: idx === 0 ? 'Minggu Berjalan' : 'Arsip Mingguan',
        isCurrent: idx === 0,
      };
    });
  }, []);

  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => weekOptions[0]?.id ?? '');

  const mergedStaffList = useMemo<PortalStaffMember[]>(() => {
    return staffList.map((stf) => {
      const ov = staffOverrides[stf.uid];
      if (!ov) return stf;
      return {
        ...stf,
        role: ov.role ?? stf.role,
        divisi: ov.divisi ?? stf.divisi,
        status: ov.status ?? (stf as { status?: string }).status,
      } as PortalStaffMember;
    });
  }, [staffList, staffOverrides]);

  const resolvedCurrentUser = useMemo<PortalStaffMember | null>(() => {
    if (!currentUser) return null;
    return mergedStaffList.find((s) => s.uid === currentUser.uid) ?? currentUser;
  }, [currentUser, mergedStaffList]);

  const isPetinggiUser = useMemo(
    () => isPetinggiRole(resolvedCurrentUser),
    [resolvedCurrentUser]
  );

  useEffect(() => {
    if (!isPetinggiUser && HR_EXECUTIVE_MENUS.has(activeMenu)) {
      setActiveMenu('dashboard_leaderboard');
    }
  }, [isPetinggiUser, activeMenu]);

  const activeStaffList = useMemo(
    () =>
      mergedStaffList.filter((s) => {
        const st = (s as { status?: string }).status;
        return st !== 'pending' && st !== 'rejected';
      }),
    [mergedStaffList]
  );

  const pendingStaffList = useMemo(
    () => mergedStaffList.filter((s) => (s as { status?: string }).status === 'pending'),
    [mergedStaffList]
  );

  const navGroups = useMemo<
    {
      label: string;
      items: { id: DashMenu; label: string; icon: React.ComponentType<{ className?: string }> }[];
    }[]
  >(() => {
    const groups: {
      label: string;
      items: { id: DashMenu; label: string; icon: React.ComponentType<{ className?: string }> }[];
    }[] = [
      {
        label: 'Utama & Personal',
        items: [
          { id: 'dashboard_leaderboard', label: 'Dashboard & Leaderboard', icon: LayoutDashboard },
          { id: 'profil_keamanan', label: 'Profil & Keamanan', icon: UserCheck },
          { id: 'anggota_staff', label: 'Anggota Staff', icon: Users },
          { id: 'voting_internal', label: 'Voting Internal', icon: Vote },
          { id: 'gaji_saya', label: 'Gaji Saya', icon: Wallet },
          { id: 'pengajuan_cuti', label: 'Pengajuan Cuti', icon: Calendar },
          { id: 'pengajuan_resign', label: 'Pengajuan Resign', icon: UserMinus },
        ],
      },
      {
        label: 'Layanan & Rekam Medis',
        items: [
          { id: 'sop_medis', label: 'SOP Medis', icon: BookOpen },
          { id: 'daftar_kematian', label: 'Daftar Kematian (CK)', icon: Skull },
          { id: 'benefit_skwb', label: 'Benefit SKWB', icon: Award },
          { id: 'hasil_sks', label: 'Hasil SKS', icon: FileCheck2 },
          { id: 'loket_farmasi', label: 'Loket & Pesanan Farmasi', icon: Pill },
          { id: 'hasil_psikologi', label: 'Hasil Tes Psikologi', icon: Activity },
          { id: 'hasil_buta_warna', label: 'Hasil Tes Buta Warna', icon: Eye },
          { id: 'data_janji_temu', label: 'Data Janji Temu', icon: Clock },
          { id: 'pengajuan_oplas', label: 'Pengajuan Operasi Plastik', icon: Sparkles },
          { id: 'jadwal_praktik', label: 'Jadwal Praktik Dokter', icon: Stethoscope },
        ],
      },
    ];

    if (isPetinggiUser) {
      groups.push({
        label: 'Manajemen HRD & Petinggi',
        items: [
          { id: 'pengelolaan_staff', label: 'Pengelolaan Staff', icon: FolderKanban },
          { id: 'approval_akun', label: 'Approval Akun', icon: UserPlus },
          { id: 'approval_cuti', label: 'Approval Cuti', icon: CheckCircle2 },
          { id: 'approval_resign', label: 'Approval Resign', icon: ShieldCheck },
          { id: 'complaint_management', label: 'Complaint Management', icon: MessageSquareWarning },
          { id: 'discord_duty_parser', label: 'Discord Duty Parser', icon: FileSpreadsheet },
          { id: 'rekap_absensi', label: 'Rekap Absensi', icon: ClipboardCheck },
          { id: 'payroll_management', label: 'Payroll Management', icon: Wallet },
          { id: 'regulation_management', label: 'Regulation Management', icon: Scale },
          { id: 'pembuatan_surat', label: 'Pembuatan Surat Resmi', icon: FileText },
        ],
      });
    }

    return groups;
  }, [isPetinggiUser]);

  const normalizedPollsForSection = useMemo(() => {
    const uid = resolvedCurrentUser?.uid ?? 'guest-staff';
    const pickedOptionId = votedIds['vote-1'];
    return votes.map((v) => ({
      id: v.id,
      question: v.judul,
      description: v.deskripsi,
      deadline: v.batasWaktu,
      allowMultiple: false,
      options: v.opsi.map((o) => ({
        id: o.id,
        label: o.label,
        count: o.suara,
      })),
      votesByUser: pickedOptionId
        ? {
            [uid]: v.opsi
              .filter((o) => o.id === pickedOptionId)
              .map((o) => o.label),
          }
        : {},
    }));
  }, [votes, votedIds, resolvedCurrentUser?.uid]);

  if (!resolvedCurrentUser) return null;

  const targetJamSaya = getTargetJamMingguan(resolvedCurrentUser.role);
  const selectedWeekObj = weekOptions.find((w) => w.id === selectedWeekId) ?? weekOptions[0];

  const menitMingguanSaya = dutyLogs
    .filter((l) => {
      if (l.staffUid !== resolvedCurrentUser.uid) return false;
      if (!selectedWeekObj) return true;
      const d = parseLogDate(l.waktuMulai);
      if (!d) return false;
      return d >= selectedWeekObj.startDate && d <= selectedWeekObj.endDate;
    })
    .reduce((acc, l) => acc + l.durasiMenit, 0);

  const menitBulananSaya = dutyLogs
    .filter((l) => l.staffUid === resolvedCurrentUser.uid)
    .reduce((acc, l) => acc + l.durasiMenit, 0);

  const totalJamGlobal = dutyLogs.reduce((acc, l) => acc + l.durasiMenit, 0) / 60;

  const handleCastVoteFromSection = (pollId: string, optionArg: unknown) => {
    if (votedIds[pollId]) {
      showToast('Anda sudah memberikan suara pada voting ini.');
      return false;
    }

    const topic = votes.find((t) => t.id === pollId);
    if (!topic) return false;

    const rawOpt = Array.isArray(optionArg) ? optionArg[0] : optionArg;
    const matchedOpt =
      topic.opsi.find((o) => o.id === String(rawOpt) || o.label === String(rawOpt)) ?? null;
    if (!matchedOpt) return false;

    setVotes((prev) =>
      prev.map((t) =>
        t.id !== pollId
          ? t
          : {
              ...t,
              opsi: t.opsi.map((o) =>
                o.id === matchedOpt.id ? { ...o, suara: o.suara + 1 } : o
              ),
            }
      )
    );
    setVotedIds((prev) => ({ ...prev, [pollId]: matchedOpt.id }));
    showToast('Suara Anda berhasil direkam.');
  };

  const handleCreatePollFromSection = (payload: Record<string, unknown>) => {
    if (!isPetinggiUser) {
      showToast('Hanya petinggi yang dapat membuat voting baru.');
      return false;
    }

    const title = String(payload.question ?? payload.judul ?? payload.title ?? '').trim();
    const desc = String(payload.description ?? payload.deskripsi ?? '').trim();
    const deadline = String(payload.deadline ?? payload.deadlineDate ?? '2026-11-30').trim();
    const rawOpts = Array.isArray(payload.options)
      ? payload.options
      : Array.isArray(payload.opsi)
        ? payload.opsi
        : [];

    const cleanLabels = rawOpts
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          return String(obj.label ?? obj.text ?? obj.nama ?? obj.opsi ?? '').trim();
        }
        return '';
      })
      .filter(Boolean);

    if (!title || cleanLabels.length < 2) return false;

    const newTopic: VoteTopic = {
      id: `vote-${Date.now()}`,
      judul: title,
      deskripsi: desc,
      batasWaktu: deadline || '2026-11-30',
      opsi: cleanLabels.map((label, idx) => ({
        id: `o-${Date.now()}-${idx}`,
        label,
        suara: 0,
      })),
    };

    setVotes((prev) => [newTopic, ...prev]);
    showToast('Voting internal baru diterbitkan.');
  };

  const renderActiveSection = () => {
    switch (activeMenu) {
      case 'dashboard_leaderboard':
        return (
          <DashboardOverviewSection
            currentUser={resolvedCurrentUser}
            activeStaffList={activeStaffList}
            dutyLogs={dutyLogs}
            weekOptions={weekOptions}
            selectedWeekId={selectedWeekId}
            onSelectWeekId={setSelectedWeekId}
            targetJamSaya={targetJamSaya}
            menitMingguanSaya={menitMingguanSaya}
            menitBulananSaya={menitBulananSaya}
            totalJamGlobal={totalJamGlobal}
          />
        );

      case 'profil_keamanan':
        return (
          <ProfileSecuritySection
            currentUser={resolvedCurrentUser}
            onNotify={showToast}
          />
        );

      case 'anggota_staff':
        return (
          <StaffDirectorySection
            activeStaffList={activeStaffList}
            onSelectStaff={(member: PortalStaffMember) => setSelectedStaffModal(member)}
          />
        );

      case 'voting_internal':
        return (
          <InternalVotingSection
            currentUser={resolvedCurrentUser}
            canCreatePoll={isPetinggiUser}
            polls={normalizedPollsForSection}
            onCreatePoll={handleCreatePollFromSection}
            onCastVote={handleCastVoteFromSection}
            onNotify={showToast}
          />
        );

      case 'gaji_saya':
        return (
          <MySalarySection
            currentUser={resolvedCurrentUser}
            dutyLogs={dutyLogs}
            weekOptions={weekOptions}
            selectedWeekId={selectedWeekId}
            onSelectWeekId={setSelectedWeekId}
            targetJamSaya={targetJamSaya}
            menitMingguanSaya={menitMingguanSaya}
            officialPaySlips={officialPaySlips}
            onNotify={showToast}
          />
        );

      case 'pengajuan_cuti':
      case 'pengajuan_resign':
        return (
          <LeaveResignSection
            mode={activeMenu === 'pengajuan_cuti' ? 'cuti' : 'resign'}
            currentUser={resolvedCurrentUser}
            leaveRequests={leaveRequests}
            onSubmitLeave={(item: LeaveRequestItem) => {
              setLeaveRequests((prev) => [item, ...prev]);
              showToast('Pengajuan cuti berhasil dikirim.');
            }}
            resignRequests={resignRequests}
            onSubmitResign={(item: ResignRequestItem) => {
              setResignRequests((prev) => [item, ...prev]);
              showToast('Pengajuan resign berhasil dikirim.');
            }}
          />
        );

      case 'sop_medis':
        return (
          <SopMedisSection
            sopBooks={sopBooks}
            onOpenBook={(book: SopBookItem) => {
              setActiveBookModal(book);
              setActiveBookPage(0);
            }}
          />
        );

      case 'daftar_kematian':
        return <DaftarKematianSection onNotify={showToast} />;

      case 'benefit_skwb':
        return <BenefitSkwbSection onNotify={showToast} />;

      case 'hasil_sks':
        return <HasilSksSection onNotify={showToast} />;

      case 'loket_farmasi':
        return <LoketFarmasiSection onNotify={showToast} />;

      case 'hasil_psikologi':
        return <HasilTesPsikologiSection onNotify={showToast} />;

      case 'hasil_buta_warna':
        return <HasilTesButaWarnaSection onNotify={showToast} />;

      case 'data_janji_temu':
        return <DataJanjiTemuSection onNotify={showToast} />;

      case 'pengajuan_oplas':
        return <PengajuanOperasiPlastikSection onNotify={showToast} />;

      case 'jadwal_praktik':
        return (
          <JadwalPraktikDokterSection
            activeStaffList={activeStaffList}
            currentUser={resolvedCurrentUser}
            schedules={doctorSchedules}
            onSchedulesChange={setDoctorSchedules}
            onNotify={showToast}
          />
        );

      case 'pembuatan_surat':
        if (!isPetinggiUser) return null;
        return (
          <OfficialLetterGenerator currentUser={resolvedCurrentUser} onNotify={showToast} />
        );

      case 'pengelolaan_staff':
      case 'approval_akun':
      case 'approval_cuti':
      case 'approval_resign':
      case 'complaint_management':
      case 'discord_duty_parser':
      case 'rekap_absensi':
      case 'payroll_management':
      case 'regulation_management':
        if (!isPetinggiUser) return null;
        return (
          <ExecutiveHrSection
            sectionKey={activeMenu}
            activeStaffList={activeStaffList}
            pendingStaffList={pendingStaffList}
            onApproveAccount={(uid: string) => {
              setStaffOverrides((prev) => ({
                ...prev,
                [uid]: { ...prev[uid], status: 'active' },
              }));
              showToast('Akun staff disetujui.');
            }}
            onRejectAccount={(uid: string) => {
              setStaffOverrides((prev) => ({
                ...prev,
                [uid]: { ...prev[uid], status: 'rejected' },
              }));
              showToast('Akun staff ditolak.');
            }}
            onChangeStaffRole={(uid: string, role: RoleName) => {
              setStaffOverrides((prev) => ({ ...prev, [uid]: { ...prev[uid], role } }));
              showToast('Jabatan staff diperbarui.');
            }}
            onChangeStaffDivision={(uid: string, divisi: DivisionName) => {
              setStaffOverrides((prev) => ({ ...prev, [uid]: { ...prev[uid], divisi } }));
              showToast('Divisi staff diperbarui.');
            }}
            leaveRequests={leaveRequests}
            onDecideLeave={(id: string, status: 'disetujui' | 'ditolak') => {
              setLeaveRequests((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status } : r))
              );
              showToast(`Pengajuan cuti ${status}.`);
            }}
            resignRequests={resignRequests}
            onDecideResign={(id: string, status: 'disetujui' | 'ditolak') => {
              setResignRequests((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status } : r))
              );
              showToast(`Pengajuan resign ${status}.`);
            }}
            dutyLogs={dutyLogs}
            onImportDiscordLogs={(entries: DutySessionLogEntry[]) =>
              setDutyLogs((prev) => [...entries, ...prev])
            }
            weekOptions={weekOptions}
            selectedWeekId={selectedWeekId}
            onSelectWeekId={setSelectedWeekId}
            officialPaySlips={officialPaySlips}
            onPublishPaySlip={(slip: OfficialPaySlipItem) => {
              setOfficialPaySlips((prev) => [slip, ...prev]);
              showToast(`Slip gaji ${slip.namaStaff} diterbitkan.`);
            }}
            sopBooks={sopBooks}
            onOpenBook={(book: SopBookItem) => {
              setActiveBookModal(book);
              setActiveBookPage(0);
            }}
            onAddRegulationBook={(book: SopBookItem) => {
              setSopBooks((prev) => [book, ...prev]);
              showToast('Regulasi baru ditambahkan.');
            }}
            onNotify={showToast}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      <SopBookModal
        book={activeBookModal}
        pageIndex={activeBookPage}
        onChangePage={setActiveBookPage}
        onClose={() => setActiveBookModal(null)}
      />

      {selectedStaffModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedStaffModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-slate-900">
                  {formatStaffDisplayName(selectedStaffModal)}
                </h3>
                <p className="text-xs font-bold text-[#8B1515]">
                  {selectedStaffModal.role} · Divisi {selectedStaffModal.divisi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <p>
                <strong>NIP:</strong> {selectedStaffModal.nip}
              </p>
              <p>
                <strong>Email:</strong> {selectedStaffModal.email}
              </p>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {!logoLoadError ? (
              <img
                src={logoSrc}
                alt="Logo RS KotaBaru"
                onError={() => setLogoLoadError(true)}
                className="h-9 w-9 shrink-0 rounded-xl border border-slate-200/80 object-contain bg-white"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8B1515] text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-heading text-sm font-extrabold text-slate-900">RS KOTABARU</p>
              <p className="text-[10px] font-semibold text-slate-400">Staff &amp; HR Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveMenu(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition ${
                        active
                          ? 'bg-rose-50 font-bold text-[#8B1515]'
                          : 'font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleOpenPublicPage}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-white py-2.5 text-xs font-bold text-[#8B1515] transition hover:bg-rose-50/70"
          >
            <Globe className="h-4 w-4" />
            <span>Buka Halaman Publik</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Staff</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-heading text-base font-extrabold text-slate-900 sm:text-lg">
                {MENU_TITLES[activeMenu]}
              </h1>
              <p className="text-[11px] text-slate-400">
                {formatStaffDisplayName(resolvedCurrentUser)} · {resolvedCurrentUser.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 sm:inline-flex">
              Duty Minggu Ini: {(menitMingguanSaya / 60).toFixed(2)} Jam
            </span>

            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                aria-label="Notifikasi"
                aria-expanded={notifOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8B1515] px-1 font-mono text-[10px] font-extrabold text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-heading text-xs font-extrabold text-slate-900">
                        Riwayat Notifikasi ({notifications.length})
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Aktivitas &amp; pembaruan portal terbaru
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllNotifRead}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-[#8B1515] hover:bg-rose-100"
                        >
                          <CheckCheck className="h-3 w-3" />
                          <span>Tandai Dibaca</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 hover:text-rose-700"
                          title="Bersihkan notifikasi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 max-h-72 space-y-1.5 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                        Belum ada notifikasi.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                            );
                            setToastMessage(item.message);
                            setTimeout(() => {
                              setToastMessage((prev) => (prev === item.message ? null : prev));
                            }, 3000);
                          }}
                          className={`flex w-full items-start justify-between gap-2.5 rounded-xl border p-2.5 text-left text-xs transition ${
                            item.read
                              ? 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
                              : 'border-rose-200/80 bg-rose-50/40 font-semibold text-slate-900 hover:bg-rose-50/70'
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-2">
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                item.read ? 'bg-slate-300' : 'bg-[#8B1515]'
                              }`}
                            />
                            <p className="line-clamp-2 text-[11px] leading-snug">
                              {item.message}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-slate-400">
                            {item.timeLabel}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-5 sm:p-6">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}