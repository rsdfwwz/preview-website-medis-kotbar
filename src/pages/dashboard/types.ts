import type { usePortal } from '@/context/PortalContext';

export type DashMenu =
  | 'dashboard_leaderboard'
  | 'profil_keamanan'
  | 'anggota_staff'
  | 'voting_internal'
  | 'gaji_saya'
  | 'pengajuan_cuti'
  | 'pengajuan_resign'
  | 'sop_medis'
  | 'daftar_kematian'
  | 'benefit_skwb'
  | 'hasil_sks'
  | 'loket_farmasi'
  | 'hasil_psikologi'
  | 'hasil_buta_warna'
  | 'data_janji_temu'
  | 'pengajuan_oplas'
  | 'jadwal_praktik'
  | 'pengelolaan_staff'
  | 'approval_akun'
  | 'approval_cuti'
  | 'approval_resign'
  | 'complaint_management'
  | 'discord_duty_parser'
  | 'rekap_absensi'
  | 'payroll_management'
  | 'regulation_management'
  | 'pembuatan_surat';

export type PortalStaffMember = ReturnType<typeof usePortal>['staffList'][number];

export interface DutySessionLogEntry {
  id: string;
  staffUid: string;
  namaStaffFormatted: string;
  waktuMulai: string;
  waktuSelesai?: string;
  durasiMenit: number;
}

export interface OfficialPaySlipItem {
  id: string;
  staffUid: string;
  namaStaff: string;
  jabatan: string;
  periodeId: string;
  periodeLabel: string;
  totalJamDuty: number;
  gajiPokok: number;
  bonusDuty: number;
  tunjanganTambahan: number;
  potongan: number;
  takeHomePay: number;
  statusPembayaran: 'Paid' | 'Pending';
  tanggalBayar: string;
}

export interface LeaveRequestItem {
  id: string;
  staffUid: string;
  namaStaff: string;
  nip: string;
  jenisCuti: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  lampiranNama?: string;
  status: 'pending' | 'disetujui' | 'ditolak';
}

export interface ResignRequestItem {
  id: string;
  staffUid: string;
  namaStaff: string;
  nip: string;
  tanggalPengajuan: string;
  tanggalEfektif: string;
  alasan: string;
  serahTerima: string;
  status: 'pending' | 'disetujui' | 'ditolak';
}

export interface VoteTopic {
  id: string;
  judul: string;
  deskripsi: string;
  batasWaktu: string;
  opsi: { id: string; label: string; suara: number }[];
}

export interface WeekPeriodOption {
  id: string;
  startDate: Date;
  endDate: Date;
  shortRange: string;
  dropdownLabel: string;
  badgeLabel: string;
  isCurrent: boolean;
}

export interface SopBookItem {
  id: string;
  kodeDokumen: string;
  docType: 'sop' | 'regulasi';
  judul: string;
  kategori: string;
  ringkasan: string;
  tarifKbrp: string;
  penulisPetinggi: string;
  tanggalUpdate: string;
  halaman: string[];
}

export type LetterTemplateId = 'kontrak_kerjasama' | 'mou_medis' | 'surat_edaran' | 'surat_tugas';
export type LetterFontStyle = 'serif' | 'sans' | 'mono';
export type LetterSectionType = 'table' | 'paragraph' | 'list' | 'callout';

export interface LetterTableRow {
  id: string;
  cells: string[];
}

export interface LetterSection {
  id: string;
  type: LetterSectionType;
  title: string;
  intro: string;
  columns: string[];
  rows: LetterTableRow[];
  content: string;
  bullets: string[];
}

export interface LetterSigner {
  id: string;
  labelAtas: string;
  kosongkanNama: boolean;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  ttdImageData?: string;
}

export interface OfficialLetterDraft {
  id: string;
  savedAt: string;
  templateId: LetterTemplateId;
  judulInstansi: string;
  subjudulRumahSakit: string;
  alamatKop: string;
  nomorSurat: string;
  kotaTanggal: string;
  lampiran: string;
  gayaHuruf: LetterFontStyle;
  perihal: string;
  tujuanPrefix: string;
  tujuanUtama: string;
  tujuanLokasi: string;
  salamPembuka: string;
  paragrafPembuka: string;
  sections: LetterSection[];
  paragrafPenutup: string;
  signers: LetterSigner[];
  footerText: string;
}