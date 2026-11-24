import type { DashMenu, LetterTemplateId } from './types';

export type DivisionName = 'Umum' | 'IGD' | 'Farmasi' | 'Psikologi' | 'HRD';

export const DIVISION_LIST: DivisionName[] = [
  'Umum',
  'IGD',
  'Farmasi',
  'Psikologi',
  'HRD',
];

export const HOURLY_RATE_BELOW_TARGET = 100000;
export const OVERTIME_BONUS_PER_HALF_HOUR = 15000;

export const LETTER_CANVAS_WIDTH = 1588;
export const LETTER_CANVAS_HEIGHT = 2246;
export const LETTER_BASE_LAYOUT_WIDTH = 794;
export const LETTER_BASE_LAYOUT_HEIGHT = 1123;

export const LETTER_TEMPLATES: {
  id: LetterTemplateId;
  label: string;
  badge?: string;
}[] = [
  {
    id: 'kontrak_kerjasama',
    label: 'Kontrak Kerja Sama (Kepolisian / Instansi)',
    badge: 'UTAMA',
  },
  {
    id: 'mou_medis',
    label: 'MoU Kerja Sama Medis (Perusahaan / Komunitas)',
  },
  {
    id: 'surat_edaran',
    label: 'Surat Edaran / Pengumuman Resmi',
  },
  {
    id: 'surat_tugas',
    label: 'Surat Tugas / Penunjukan Resmi Staff',
  },
];

export const MENU_TITLES: Record<DashMenu, string> = {
  dashboard_leaderboard: 'Dashboard & Leaderboard',
  profil_keamanan: 'Profil & Keamanan',
  anggota_staff: 'Anggota Staff',
  voting_internal: 'Voting Internal',
  gaji_saya: 'Gaji Saya',
  pengajuan_cuti: 'Pengajuan Cuti',
  pengajuan_resign: 'Pengajuan Resign',
  sop_medis: 'SOP Medis',
  daftar_kematian: 'Daftar Kematian (CK)',
  benefit_skwb: 'Benefit SKWB',
  hasil_sks: 'Hasil Surat Keterangan Sehat',
  loket_farmasi: 'Loket & Pesanan Farmasi',
  hasil_psikologi: 'Hasil Tes Psikologi',
  hasil_buta_warna: 'Hasil Tes Buta Warna',
  data_janji_temu: 'Data Janji Temu',
  pengajuan_oplas: 'Pengajuan Operasi Plastik',
  jadwal_praktik: 'Jadwal Praktik Dokter',
  pengelolaan_staff: 'Pengelolaan Staff',
  approval_akun: 'Approval Akun',
  approval_cuti: 'Approval Cuti',
  approval_resign: 'Approval Resign',
  complaint_management: 'Complaint Management',
  discord_duty_parser: 'Discord Duty Parser & Audit',
  rekap_absensi: 'Rekap Absensi Mingguan & Bulanan',
  payroll_management: 'Payroll Management',
  regulation_management: 'Regulation Management',
  pembuatan_surat: 'Pembuatan Surat Resmi',
};

export const LEAVE_TYPES = [
  'Cuti Tahunan',
  'Cuti Sakit / Pemulihan',
  'Cuti Keperluan Pribadi',
  'Cuti Tugas / Dinas Luar',
];

export const BULAN_INDO = [
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