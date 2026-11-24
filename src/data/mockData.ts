import type {
  AnomalyAlert,
  Announcement,
  CitizenComplaint,
  DutyLog,
  NameChangeRequest,
  OfficialCertificate,
  RecruitmentApplication,
  ServiceSubmission,
  StaffProfile,
} from '@/types';

export interface PharmacyPackage {
  id: string;
  namaPaket: string;
  deskripsi: string;
  hargaKbrp: number;
  isiPaket: string;
  stokTersedia: number;
}

export interface MedicalRegulationItem {
  id: string;
  kategori: 'Administrasi & Surat' | 'Poli & Tindakan Medis' | 'Bedah & Forensik' | 'Benefit Warga Baru (SKWB)';
  namaTindakan: string;
  tarifKbrp: string;
  keterangan: string;
}

export const PHARMACY_PACKAGES: PharmacyPackage[] = [
  {
    id: 'frm-1',
    namaPaket: 'Paket Perban (10 Pcs)',
    deskripsi: 'Perban medis steril standar penanganan luka ringan hingga sedang.',
    hargaKbrp: 25000,
    isiPaket: '10x Medical Bandage',
    stokTersedia: 180,
  },
  {
    id: 'frm-2',
    namaPaket: 'Paket Obat Antidepresan (5 Pcs)',
    deskripsi: 'Obat penenang stres & pemulihan kondisi psikologis warga.',
    hargaKbrp: 25000,
    isiPaket: '5x Antidepressant Pill',
    stokTersedia: 120,
  },
  {
    id: 'frm-3',
    namaPaket: 'Bundle Pengobatan',
    deskripsi: 'Paket hemat kombinasi perawatan luka fisik dan stabilisasi stres.',
    hargaKbrp: 40000,
    isiPaket: '10x Bandage + 5x Antidepresan',
    stokTersedia: 95,
  },
  {
    id: 'frm-4',
    namaPaket: 'Bundle Penyembuhan',
    deskripsi: 'Paket lengkap pemulihan intensif untuk aktivitas luar kota.',
    hargaKbrp: 45000,
    isiPaket: '15x Bandage + 5x Antidepresan',
    stokTersedia: 75,
  },
];

export const MEDICAL_REGULATIONS: MedicalRegulationItem[] = [
  {
    id: 'reg-01',
    kategori: 'Administrasi & Surat',
    namaTindakan: 'Surat Keterangan Sehat (SKS)',
    tarifKbrp: '$15.000 KBRP',
    keterangan: 'Syarat melamar pekerjaan instansi, pembuatan SIM/Lisensi, dan pemeriksaan rutin.',
  },
  {
    id: 'reg-02',
    kategori: 'Administrasi & Surat',
    namaTindakan: 'Surat Keterangan Psikologi',
    tarifKbrp: '$25.000 KBRP',
    keterangan: 'Wajib untuk pendaftaran instansi pemerintahan, kepemilikan senjata resmi, & evaluasi mental.',
  },
  {
    id: 'reg-03',
    kategori: 'Administrasi & Surat',
    namaTindakan: 'Tes Buta Warna (20 Lempeng Ishihara)',
    tarifKbrp: '$10.000 KBRP',
    keterangan: 'Uji diagnostik penglihatan warna terkalibrasi (Lulus minimal benar 16 dari 20 lempeng).',
  },
  {
    id: 'reg-04',
    kategori: 'Poli & Tindakan Medis',
    namaTindakan: 'Konsultasi Poli Umum & Penanganan Pingsan (Revive)',
    tarifKbrp: '$15.000 - $30.000 KBRP',
    keterangan: 'Tergantung lokasi evakuasi (Dalam Kota / Luar Kota / Area Merah).',
  },
  {
    id: 'reg-05',
    kategori: 'Bedah & Forensik',
    namaTindakan: 'Operasi Plastik / Bedah Estetika',
    tarifKbrp: '$75.000 KBRP',
    keterangan: 'Dilakukan oleh Dokter Spesialis di ruang bedah Pillbox Medical Center.',
  },
  {
    id: 'reg-06',
    kategori: 'Bedah & Forensik',
    namaTindakan: 'Administrasi Karakter Kill (CK) & Pemakaman',
    tarifKbrp: '$50.000 KBRP',
    keterangan: 'Mencakup visum forensik, sertifikat kematian resmi, dan prosesi penguburan/kremasi.',
  },
  {
    id: 'reg-07',
    kategori: 'Benefit Warga Baru (SKWB)',
    namaTindakan: 'Paket Benefit Pemegang SKWB (Berlaku 7 Hari)',
    tarifKbrp: 'GRATIS / DISKON 50%',
    keterangan: 'Free Operasi Plastik 1x, Diskon 50% Layanan Treatment, dan Gratis 1x Paket Perban.',
  },
];

export const INITIAL_STAFF: StaffProfile[] = [
  {
    uid: 'staff-001',
    email: 'louis.benedict@rskotabaru.id',
    namaIc: 'Louis Benedict',
    spesialisasi: 'Sp.B',
    memilikiGelarDokter: true,
    nip: 'KBR-MED-001',
    discordId: '104829104829104829',
    discordUsername: 'louisbenedict#0001',
    role: 'Director',
    divisi: 'Manajemen',
    jadwalShift: 'Siaga 24 Jam',
    statusDuty: 'on_duty',
    menitDutyHarian: 185,
    menitDutyMingguan: 1020,
    menitDutyBulanan: 3840,
    totalMenitDuty: 18420,
    tarifPerJam: 15000,
    nomorRekening: 'KBR-001-8891',
    statusAkun: 'aktif',
    bergabungPada: '2026-01-05',
  },
  {
    uid: 'staff-002',
    email: 'nadya.kusuma@rskotabaru.id',
    namaIc: 'Nadya Kusuma',
    spesialisasi: 'Sp.KJ',
    memilikiGelarDokter: true,
    nip: 'KBR-MED-002',
    discordId: '204829104829104830',
    discordUsername: 'nadyakusuma',
    role: 'Deputy Director',
    divisi: 'Psikologi',
    jadwalShift: 'Shift 1 (08:00 - 16:00)',
    statusDuty: 'on_duty',
    menitDutyHarian: 150,
    menitDutyMingguan: 890,
    menitDutyBulanan: 3210,
    totalMenitDuty: 14200,
    tarifPerJam: 13500,
    nomorRekening: 'KBR-002-7741',
    statusAkun: 'aktif',
    bergabungPada: '2026-01-12',
  },
  {
    uid: 'staff-003',
    email: 'alvaro.pratama@rskotabaru.id',
    namaIc: 'Alvaro Pratama',
    nip: 'KBR-MED-005',
    discordId: '304829104829104831',
    discordUsername: 'alvarohrd',
    role: 'Human Resources Department',
    divisi: 'Manajemen',
    jadwalShift: 'Shift 1 (08:00 - 16:00)',
    statusDuty: 'on_duty',
    menitDutyHarian: 120,
    menitDutyMingguan: 780,
    menitDutyBulanan: 2940,
    totalMenitDuty: 11200,
    tarifPerJam: 12000,
    nomorRekening: 'KBR-005-6620',
    statusAkun: 'aktif',
    bergabungPada: '2026-02-01',
  },
  {
    uid: 'staff-004',
    email: 'reihan.wijaya@rskotabaru.id',
    namaIc: 'Reihan Wijaya',
    spesialisasi: 'Sp.BP',
    nip: 'KBR-MED-011',
    discordId: '404829104829104832',
    discordUsername: 'reihan.bedah',
    role: 'Doctor Specialist',
    divisi: 'Bedah Plastik',
    jadwalShift: 'Shift 2 (16:00 - 00:00)',
    statusDuty: 'on_duty',
    menitDutyHarian: 210,
    menitDutyMingguan: 1140,
    menitDutyBulanan: 3560,
    totalMenitDuty: 12900,
    tarifPerJam: 11000,
    nomorRekening: 'KBR-011-5519',
    statusAkun: 'aktif',
    bergabungPada: '2026-02-18',
  },
  {
    uid: 'staff-005',
    email: 'keira.anindya@rskotabaru.id',
    namaIc: 'Keira Anindya',
    nip: 'KBR-MED-019',
    discordId: '504829104829104833',
    discordUsername: 'keira.md',
    role: 'Doctor',
    divisi: 'Poli Umum',
    jadwalShift: 'Shift 1 (08:00 - 16:00)',
    statusDuty: 'off_duty',
    menitDutyHarian: 95,
    menitDutyMingguan: 680,
    menitDutyBulanan: 2450,
    totalMenitDuty: 8450,
    tarifPerJam: 9500,
    nomorRekening: 'KBR-019-4402',
    statusAkun: 'aktif',
    bergabungPada: '2026-03-10',
  },
  {
    uid: 'staff-006',
    email: 'clarissa.putri@rskotabaru.id',
    namaIc: 'Clarissa Putri',
    nip: 'KBR-MED-028',
    discordId: '604829104829104834',
    discordUsername: 'clarissa.ns',
    role: 'Nurse',
    divisi: 'IGD',
    jadwalShift: 'Shift 2 (16:00 - 00:00)',
    statusDuty: 'on_duty',
    menitDutyHarian: 240,
    menitDutyMingguan: 1260,
    menitDutyBulanan: 4120,
    totalMenitDuty: 9820,
    tarifPerJam: 7500,
    nomorRekening: 'KBR-028-3318',
    statusAkun: 'aktif',
    bergabungPada: '2026-04-02',
  },
];

export const INITIAL_DUTY_LOGS: DutyLog[] = [
  {
    id: 'log-01',
    staffUid: 'staff-001',
    namaStaffFormatted: 'Dr. Louis Benedict, Sp.B',
    nip: 'KBR-MED-001',
    discordUsername: 'louisbenedict#0001',
    waktuMulai: '2026-11-20 08:30',
    durasiMenit: 185,
    sumber: 'Discord Log',
    status: 'aktif',
  },
  {
    id: 'log-02',
    staffUid: 'staff-004',
    namaStaffFormatted: 'Dr. Reihan Wijaya, Sp.BP',
    nip: 'KBR-MED-011',
    discordUsername: 'reihan.bedah',
    waktuMulai: '2026-11-20 08:00',
    durasiMenit: 210,
    sumber: 'Discord Log',
    status: 'aktif',
  },
  {
    id: 'log-03',
    staffUid: 'staff-006',
    namaStaffFormatted: 'Ns. Clarissa Putri',
    nip: 'KBR-MED-028',
    discordUsername: 'clarissa.ns',
    waktuMulai: '2026-11-20 07:30',
    durasiMenit: 240,
    sumber: 'Discord Log',
    status: 'aktif',
  },
  {
    id: 'log-04',
    staffUid: 'staff-005',
    namaStaffFormatted: 'Dr. Keira Anindya',
    nip: 'KBR-MED-019',
    discordUsername: 'keira.md',
    waktuMulai: '2026-11-19 19:00',
    waktuSelesai: '2026-11-19 22:15',
    durasiMenit: 195,
    sumber: 'Discord Log',
    status: 'selesai',
  },
];

export const INITIAL_NAME_REQUESTS: NameChangeRequest[] = [
  {
    id: 'ncr-01',
    staffUid: 'staff-005',
    nip: 'KBR-MED-019',
    namaLama: 'Keira Anindya',
    namaBaru: 'Keira Valeriana',
    alasan: 'Ganti Identitas Warga Kota (Akta Catatan Sipil)',
    diajukanPada: '2026-11-20 09:10',
    status: 'pending',
  },
];

export const INITIAL_ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: 'anom-01',
    staffUid: 'staff-005',
    namaStaffFormatted: 'Dr. Keira Anindya',
    nip: 'KBR-MED-019',
    discordUsername: 'keira.md',
    jenisPelanggaran: 'Ambil Stok Farmasi Saat Off-Duty',
    detailAktivitas: 'Mengambil 1x Bundle Pengobatan dari Brankas Farmasi saat status Discord OFF DUTY.',
    waktuKejadian: '2026-11-19 23:42',
    statusAudit: 'perlu_tinjauan',
  },
];

export const INITIAL_SUBMISSIONS: ServiceSubmission[] = [
  {
    id: 'sub-01',
    kodeTiket: 'KBR-TKT-1042',
    jenisLayanan: 'Janji Temu Poli',
    namaWarga: 'Bima Baskara',
    citizenId: 'KBR-88210',
    noHpIc: '555-0192',
    dokterTujuanUid: 'staff-001',
    detailPermintaan: 'Konsultasi pemeriksaan pasca-kecelakaan & pengurusan SKS.',
    totalBiayaKbrp: 15000,
    status: 'menunggu',
    dibuatPada: '2026-11-20 10:15',
  },
  {
    id: 'sub-02',
    kodeTiket: 'KBR-TKT-1041',
    jenisLayanan: 'Klaim Benefit SKWB',
    namaWarga: 'Raka Mahendra',
    citizenId: 'KBR-99412',
    noHpIc: '555-0844',
    detailPermintaan: 'Klaim Free Operasi Plastik 1x + Gratis 1x Paket Perban (SKWB Hari ke-3).',
    totalBiayaKbrp: 0,
    status: 'diproses',
    dibuatPada: '2026-11-20 09:40',
    ditanganiOlehFormatted: 'Dr. Reihan Wijaya, Sp.BP',
  },
];

export const INITIAL_CERTIFICATES: OfficialCertificate[] = [
  {
    noSurat: 'SKS-KBR-2026-0891',
    jenisSurat: 'Surat Keterangan Sehat (SKS)',
    namaPenerima: 'Bima Baskara',
    citizenId: 'KBR-88210',
    hasilPemeriksaan: 'DINYATAKAN SEHAT JASMANI & ROHANI (TD: 120/80 mmHg, Penglihatan Normal)',
    catatanMedis: 'Memenuhi syarat kesehatan untuk melamar pekerjaan instansi & pembuatan lisensi.',
    penerbitFormatted: 'Dr. Louis Benedict, Sp.B',
    penerbitRole: 'Director',
    penerbitNip: 'KBR-MED-001',
    tanggalTerbit: '2026-11-20',
    berlakuHingga: '2026-12-20',
    statusValiditas: 'SAH / VALID',
  },
  {
    noSurat: 'PSI-KBR-2026-0314',
    jenisSurat: 'Surat Hasil Tes Psikologi',
    namaPenerima: 'Arsya Pratama',
    citizenId: 'KBR-77120',
    hasilPemeriksaan: 'STABIL & LAYAK MENTAL (Skor Evaluasi Psikometri: 94/100)',
    catatanMedis: 'Memenuhi standar evaluasi psikologi untuk pendaftaran instansi pemerintahan.',
    penerbitFormatted: 'Dr. Nadya Kusuma, Sp.KJ',
    penerbitRole: 'Deputy Director',
    penerbitNip: 'KBR-MED-002',
    tanggalTerbit: '2026-11-18',
    berlakuHingga: '2026-12-18',
    statusValiditas: 'SAH / VALID',
  },
];

export const INITIAL_COMPLAINTS: CitizenComplaint[] = [
  {
    id: 'cmp-01',
    jenisPengaduan: 'Apresiasi Pelayanan',
    namaPelapor: 'Anonim',
    anonim: true,
    subjek: 'Respons Cepat Tim IGD di Area Sandy Shores',
    kronologi: 'Terima kasih untuk tim Paramedic yang langsung datang kurang dari 3 menit saat kecelakaan.',
    tanggalKirim: '2026-11-19',
    status: 'ditindaklanjuti',
  },
];

export const INITIAL_RECRUITMENTS: RecruitmentApplication[] = [
  {
    id: 'rec-01',
    namaIc: 'Damian Saputra',
    citizenId: 'KBR-91045',
    umurIc: '24 Tahun',
    discordTag: 'damiansaputra',
    pengalamanMedis: 'Pernah menjadi relawan medis & memahami SOP P3K dasar.',
    motivasi: 'Ingin mengabdi di Rumah Sakit Kota Baru dan membantu warga saat jam sibuk.',
    tanggalDaftar: '2026-11-20',
    status: 'seleksi',
  },
];

// Data pengumuman awal. Isi dapat ditambahkan melalui pengelolaan pengumuman.
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
