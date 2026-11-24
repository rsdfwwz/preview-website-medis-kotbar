// =========================================================================
// BAGIAN 1: ROLE, LEVEL JABATAN & STATUS DUTY
// =========================================================================
export type RoleName =
  | 'Medical Student'
  | 'Trainee'
  | 'Nurse'
  | 'Co-Ass'
  | 'Pharmacist'
  | 'Doctor'
  | 'Doctor Specialist'
  | 'Human Resources Department'
  | 'Secretary & Treasurer'
  | 'Deputy Director'
  | 'Director'
  | 'Hospital Comitee';

export const ROLE_LEVELS: Record<RoleName, number> = {
  'Medical Student': 1,
  Trainee: 2,
  Nurse: 3,
  'Co-Ass': 4,
  Pharmacist: 5,
  Doctor: 6,
  'Doctor Specialist': 7,
  'Human Resources Department': 8,
  'Secretary & Treasurer': 9,
  'Deputy Director': 10,
  Director: 11,
  'Hospital Comitee': 12,
};

export const ROLE_LIST: RoleName[] = [
  'Medical Student',
  'Trainee',
  'Nurse',
  'Co-Ass',
  'Pharmacist',
  'Doctor',
  'Doctor Specialist',
  'Human Resources Department',
  'Secretary & Treasurer',
  'Deputy Director',
  'Director',
  'Hospital Comitee',
];

export type DutyStatus = 'on_duty' | 'off_duty' | 'cuti';

export type StaffDivision =
  | 'IGD'
  | 'Poli Umum'
  | 'Bedah Plastik'
  | 'Psikologi'
  | 'Farmasi'
  | 'Forensik & CK'
  | 'Manajemen';

export type StaffShiftSchedule =
  | 'Shift 1 (08:00 - 16:00)'
  | 'Shift 2 (16:00 - 00:00)'
  | 'Siaga 24 Jam';

// =========================================================================
// BAGIAN 2: PROFIL STAFF, PENGAJUAN NAMA, TTD & LOG DUTY
// =========================================================================
export interface StaffProfile {
  uid: string;
  email: string;
  namaIc: string; // Nama asli tanpa gelar, misal: "Louis Benedict"
  spesialisasi?: string; // Opsional untuk Doctor Specialist, misal: "Sp.B" atau "Sp.KJ"
  memilikiGelarDokter?: boolean; // True jika petinggi (Lv 8-12) berlatar belakang Dokter
  nip: string; // Nomor Induk Pegawai Medis, misal: "KBR-MED-001"
  discordId: string; // Hanya tampil di Audit OOC Petinggi & dipakai untuk tag webhook
  discordUsername: string; // Hanya tampil di Audit OOC Petinggi
  role: RoleName;
  divisi: StaffDivision;
  jadwalShift: StaffShiftSchedule;
  statusDuty: DutyStatus;
  menitDutyHarian: number;
  menitDutyMingguan: number;
  menitDutyBulanan: number;
  totalMenitDuty: number;
  tarifPerJam: number;
  nomorRekening: string;
  statusAkun: 'aktif' | 'pending_acc';
  bergabungPada: string;
}

export interface LetterSigner {
  id: string;
  labelAtas: string;
  nama?: string;
  jabatan?: string;
  nip?: string;
  ttdImageData?: string | null;
}

export interface NameChangeRequest {
  id: string;
  staffUid: string;
  nip: string;
  namaLama: string;
  namaBaru: string;
  alasan: string; // Misal: "Character Kill (CK) / Ganti Identitas Kota"
  diajukanPada: string;
  status: 'pending' | 'disetujui' | 'ditolak';
  diprosesOleh?: string;
}

export interface DutyLog {
  id: string;
  staffUid: string;
  namaStaffFormatted: string;
  nip: string;
  discordUsername: string; // Audit OOC
  waktuMulai: string;
  waktuSelesai?: string;
  durasiMenit: number;
  sumber: 'Discord Log';
  status: 'aktif' | 'selesai';
}

export interface AnomalyAlert {
  id: string;
  staffUid: string;
  namaStaffFormatted: string;
  nip: string;
  discordUsername: string;
  jenisPelanggaran:
    | 'Ambil Stok Farmasi Saat Off-Duty'
    | 'Buat Tagihan/Surat Saat Off-Duty';
  detailAktivitas: string;
  waktuKejadian: string;
  statusAudit: 'perlu_tinjauan' | 'selesai_ditindak';
}

// =========================================================================
// BAGIAN 3: LAYANAN WARGA, SERTIFIKAT, KELUHAN & REKRUTMEN
// =========================================================================
export type ServiceType =
  | 'Surat Kesehatan'
  | 'Janji Temu Poli'
  | 'Operasi Plastik'
  | 'Tes Buta Warna'
  | 'Tes Psikologi'
  | 'Klaim Benefit SKWB'
  | 'Karakter Kill'
  | 'Loket Farmasi';

export interface ServiceSubmission {
  id: string;
  kodeTiket: string;
  jenisLayanan: ServiceType;
  namaWarga: string;
  citizenId: string;
  noHpIc: string;
  dokterTujuanUid?: string; // Untuk fitur auto-tag Discord saat Janji Temu
  detailPermintaan: string;
  totalBiayaKbrp: number;
  status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak';
  dibuatPada: string;
  ditanganiOlehFormatted?: string;
}

export type OfficialCertificateType =
  | 'Surat Keterangan Sehat (SKS)'
  | 'Surat Hasil Tes Psikologi'
  | 'Sertifikat Kematian (CK)'
  | 'MoU Instansi';

export interface OfficialCertificate {
  noSurat: string; // Contoh: "SKS-KBR-2026-0041" -> dipakai untuk URL /verify/:noSurat
  jenisSurat: OfficialCertificateType;
  namaPenerima: string;
  citizenId: string;
  hasilPemeriksaan: string;
  catatanMedis: string;
  penerbitFormatted: string; // Nama dokter + gelar otomatis
  penerbitRole: RoleName;
  penerbitNip: string;
  tanggalTerbit: string;
  berlakuHingga: string;
  statusValiditas: 'SAH / VALID' | 'DICABUT';
}

export interface CitizenComplaint {
  id: string;
  jenisPengaduan: 'Laporan / Keluhan' | 'Kritik & Saran' | 'Apresiasi Pelayanan';
  namaPelapor: string; // "Anonim" jika dicentang anonim
  anonim: boolean;
  subjek: string;
  kronologi: string;
  lampiranNama?: string;
  tanggalKirim: string;
  status: 'baru' | 'ditindaklanjuti';
}

export interface RecruitmentApplication {
  id: string;
  namaIc: string;
  citizenId: string;
  umurIc: string;
  discordTag: string;
  pengalamanMedis: string;
  motivasi: string;
  tanggalDaftar: string;
  status: 'seleksi' | 'diterima' | 'ditolak';
}

// =========================================================================
// PENGUMUMAN PUBLIK
// =========================================================================
export interface Announcement {
  id: string;
  penting: boolean;
  kategori: string;
  penulis: string;
  dipublikasikanPada: string;
  judul: string;
  isi: string;
}
