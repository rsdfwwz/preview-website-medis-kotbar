import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Ambulance,
  ArrowRight,
  Award,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  HeartHandshake,
  HeartPulse,
  MapPin,
  MessageSquareWarning,
  PhoneCall,
  Pill,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import type { CitizenComplaint } from '@/types';
import { formatStaffDisplayName, getDutyStatusBadge } from '@/utils/formatters';

interface GalleryItem {
  id: string;
  judul: string;
  kategori: string;
  lokasi: string;
  deskripsi: string;
  imageUrl: string;
}

const HOSPITAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    judul: 'Gedung Utama Pillbox Medical Center',
    kategori: 'Fasilitas Utama',
    lokasi: 'Koordinat 201 · Pusat Kota Baru',
    deskripsi:
      'Pusat pelayanan kesehatan terpadu 24 jam dengan akses lobi triase cepat dan jalur khusus ambulans.',
    imageUrl:
      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'gal-2',
    judul: 'Unit Gawat Darurat (IGD) & Ruang Trauma',
    kategori: 'Pelayanan Kritis',
    lokasi: 'Lantai 1 · Sayap Timur Pillbox',
    deskripsi:
      'Dilengkapi monitor hemodinamik modern dan peralatan resusitasi untuk penanganan korban kecelakaan berat.',
    imageUrl:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'gal-3',
    judul: 'Armada Ambulans & Evakuasi Udara (Heli Medis)',
    kategori: 'Tim Reaksi Cepat',
    lokasi: 'Helipad & Garasi Utama RS-KBR',
    deskripsi:
      'Unit darat dan helikopter evakuasi siap menjangkau wilayah pegunungan, pelabuhan, maupun jalan tol kota.',
    imageUrl:
      'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'gal-4',
    judul: 'Ruang Bedah Plastik & Rekonstruksi Estetika',
    kategori: 'Poli Spesialis',
    lokasi: 'Lantai 2 · Klinik Spesialis',
    deskripsi:
      'Ruang operasi steril berstandar tinggi untuk tindakan bedah rekonstruksi wajah dan klaim benefit SKWB.',
    imageUrl:
      'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'gal-5',
    judul: 'Instalasi Farmasi & Apotek 24 Jam',
    kategori: 'Farmasi & Obat',
    lokasi: 'Lobi Utama · Loket Farmasi',
    deskripsi:
      'Penyediaan paket perban medis, vitamin pemulihan, dan obat antidepresan resmi Rumah Sakit Kota Baru.',
    imageUrl:
      'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'gal-6',
    judul: 'Ruang Diagnostik Psikologi & Tes Ishihara',
    kategori: 'Administrasi Instansi',
    lokasi: 'Lantai 2 · Poli Evaluasi',
    deskripsi:
      'Fasilitas pengujian kesehatan jasmani, tes buta warna 20 lempeng Ishihara, dan evaluasi psikologi resmi.',
    imageUrl:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
  },
];

export function LandingPage() {
  const { staffList, submitComplaint } = usePortal();

  // State Lightbox Galeri
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);

  // State Form Kotak Keluhan Warga di Halaman Utama
  const [jenisPengaduan, setJenisPengaduan] =
    useState<CitizenComplaint['jenisPengaduan']>('Laporan / Keluhan');
  const [anonim, setAnonim] = useState(false);
  const [namaPelapor, setNamaPelapor] = useState('');
  const [subjek, setSubjek] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const activeStaff = staffList.filter((s) => s.statusAkun === 'aktif');
  const onDutyStaff = activeStaff.filter((s) => s.statusDuty === 'on_duty');

  const coreServices = [
    {
      num: '01',
      title: 'Surat Keterangan Sehat (SKS)',
      desc: 'Pemeriksaan fisik lengkap untuk syarat melamar pekerjaan instansi & pembuatan lisensi.',
      price: '$15.000',
      tab: 'Surat Kesehatan',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Poli Umum & Janji Temu Dokter',
      desc: 'Reservasi konsultasi dokter jaga maupun spesialis dengan notifikasi Discord otomatis.',
      price: '$15.000',
      tab: 'Janji Temu Poli',
      icon: Stethoscope,
    },
    {
      num: '03',
      title: 'Operasi Plastik & Rekonstruksi',
      desc: 'Layanan bedah estetika wajah & tubuh (Gratis 1x bagi pemegang voucher SKWB).',
      price: '$75.000',
      tab: 'Operasi Plastik',
      icon: Sparkles,
    },
    {
      num: '04',
      title: 'Tes Buta Warna (20 Lempeng Ishihara)',
      desc: 'Uji diagnostik penglihatan warna interaktif berstandar klinis dengan sertifikat resmi.',
      price: '$10.000',
      tab: 'Tes Buta Warna',
      icon: Eye,
    },
    {
      num: '05',
      title: 'Tes Psikologi & Evaluasi Mental',
      desc: 'Pemeriksaan kesehatan psikologis untuk syarat kepolisian, pemerintahan, maupun mandiri.',
      price: '$25.000',
      tab: 'Tes Psikologi',
      icon: Brain,
    },
    {
      num: '06',
      title: 'Klaim Benefit Warga Baru (SKWB)',
      desc: 'Klaim fasilitas gratis 7 hari pertama bagi warga baru pemegang kartu SKWB.',
      price: 'GRATIS',
      tab: 'Klaim Benefit SKWB',
      icon: ShieldCheck,
    },
    {
      num: '07',
      title: 'Administrasi Karakter Kill (CK)',
      desc: 'Pencatatan forensik kematian karakter resmi dan pilihan prosesi pemakaman.',
      price: '$50.000',
      tab: 'Karakter Kill',
      icon: HeartHandshake,
    },
    {
      num: '08',
      title: 'Loket Farmasi & Paket Perban',
      desc: 'Pemesanan paket perban medis, obat pemulihan, dan vitamin 24 jam di Pillbox.',
      price: 'Mulai $5.000',
      tab: 'Loket Farmasi',
      icon: Pill,
    },
  ];

  const handleQuickComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjek.trim() || !kronologi.trim()) return;

    submitComplaint({
      jenisPengaduan,
      anonim,
      namaPelapor: anonim ? 'Anonim' : namaPelapor,
      subjek: subjek.trim(),
      kronologi: kronologi.trim(),
    });

    setComplaintSuccess(true);
    setSubjek('');
    setKronologi('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ================================================================= */}
      {/* 1. HERO SECTION PILLBOX MEDICAL CENTER                            */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#6D0E0E] via-[#8B1515] to-[#3B0707] py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              IGD Pillbox Medical Center Siaga 24/7 · Koordinat 201
            </div>

            <h1 className="mt-5 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Pelayanan Medis Cepat, Profesional & Terpercaya di{' '}
              <span className="text-amber-300">Kota Baru</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-red-100/90 sm:text-base">
              Portal resmi Rumah Sakit Kota Baru (KBR) untuk pengajuan surat kesehatan, janji temu
              poli spesialis, pemeriksaan psikologi, tes Ishihara, hingga verifikasi keaslian
              sertifikat medis berbasis QR Code.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/layanan"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-extrabold text-red-900 shadow-md transition hover:bg-red-50 sm:text-sm"
              >
                Ajukan Layanan Medis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/jadwal-dokter"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20 sm:text-sm"
              >
                <Stethoscope className="h-4 w-4" />
                Jadwal Dokter Jaga
              </Link>
              <a
                href="#kotak-keluhan"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/15 px-5 py-3.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25 sm:text-sm"
              >
                <MessageSquareWarning className="h-4 w-4" />
                Kotak Keluhan Warga
              </a>
            </div>

            {/* Statistik Singkat */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:max-w-lg">
              <div>
                <p className="font-heading text-2xl font-extrabold text-white">24 / 7</p>
                <p className="text-[11px] text-red-200">Layanan Gawat Darurat</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-extrabold text-amber-300">
                  {activeStaff.length} Staff
                </p>
                <p className="text-[11px] text-red-200">Tenaga Medis Terdaftar</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-extrabold text-white">8 Modul</p>
                <p className="text-[11px] text-red-200">Layanan Mandiri Warga</p>
              </div>
            </div>
          </div>

          {/* Kartu Status Operasional & Cek QR */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="font-heading text-sm font-bold">
                    Tim Medis Bertugas Saat Ini
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  {onDutyStaff.length} On Duty
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {activeStaff.slice(0, 4).map((stf) => {
                  const badge = getDutyStatusBadge(stf.statusDuty);
                  return (
                    <div
                      key={stf.uid}
                      className="flex items-center justify-between rounded-2xl bg-black/20 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{formatStaffDisplayName(stf)}</p>
                        <p className="text-[11px] text-red-200">
                          {stf.role} · Divisi {stf.divisi}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs">
                <span className="flex items-center gap-1.5 text-red-100">
                  <PhoneCall className="h-3.5 w-3.5 text-amber-300" />
                  Hotline Darurat Kota: <strong>911 / EMS</strong>
                </span>
                <Link
                  to="/verify"
                  className="inline-flex items-center gap-1 font-bold text-amber-300 hover:underline"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Verifikasi Surat QR →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. MISI & KOMITMEN PELAYANAN KOTA BARU                            */}
      {/* ================================================================= */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50/70 via-white to-slate-50 p-8 shadow-2xs sm:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-red-800">
                <HeartPulse className="h-3.5 w-3.5" />
                Misi & Komitmen Pelayanan Kota Baru
              </span>

              <blockquote className="mt-5 font-heading text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">
                “Berdedikasi Utuh untuk Keselamatan Anda, Hadir Menjawab Setiap Panggilan Jiwa
                dengan Penanganan Medis Terdepan dan Sepenuh Hati.”
              </blockquote>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Paramedic Kota Baru berkomitmen memberikan standar perawatan tertinggi melalui
                kecepatan respon, keahlian medis profesional, dan integritas yang dapat Anda
                percayai kapan saja.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 font-heading text-sm font-bold text-slate-900">
                  Kecepatan Respon Darurat
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Sistem pengiriman unit ambulans terkoordinasi untuk menjangkau titik panggilan
                  darurat di seluruh penjuru Kota Baru dalam waktu singkat.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 font-heading text-sm font-bold text-slate-900">
                  Keahlian Medis Tersertifikasi
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Setiap dokter, spesialis, dan paramedis melewati jenjang pendidikan klinis ketat
                  sesuai SOP Rumah Sakit Kota Baru.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 font-heading text-sm font-bold text-slate-900">
                  Integritas & Transparansi
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Tarif tindakan medis jelas, dokumentasi terarsip rapi, serta perlindungan penuh
                  terhadap kerahasiaan data rekam medis pasien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. MENGAPA MEMILIH KAMI                                           */}
      {/* ================================================================= */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              Keunggulan Layanan RS-KBR
            </p>
            <h2 className="mt-1.5 font-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Mengapa Memilih Paramedic Kota Baru?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Kami menggabungkan kesiapsiagaan medis lapangan dengan sistem administrasi digital
              modern demi kenyamanan seluruh warga.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:border-red-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-800">
                <Ambulance className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900">
                Evakuasi Darat & Udara
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Armada ambulans darat maupun helikopter medis siap melakukan penyelamatan di lokasi
                terjal, perairan, hingga area terpencil.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:border-red-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-800">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900">
                Sertifikat Medis QR Resmi
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Setiap Surat Keterangan Sehat & Hasil Psikologi dilengkapi kode verifikasi digital
                yang diakui resmi oleh Kepolisian & Pemerintah Kota.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:border-red-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-800">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900">
                Loket Mandiri Tanpa Antre
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Ajukan layanan kesehatan, pesanan farmasi, hingga janji temu dokter secara daring
                sebelum tiba di Pillbox Medical Center.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:border-red-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-800">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900">
                Program Warga Baru (SKWB)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Dukungan penuh bagi pendatang baru berupa gratis operasi plastik 1x, diskon 50%
                perawatan, dan paket perban gratis selama 7 hari.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. FITUR LAYANAN UTAMA (8 MODUL PELAYANAN WARGA)                  */}
      {/* ================================================================= */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-red-700">
                8 Modul Pelayanan Terpadu
              </p>
              <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
                Fitur Layanan Utama Warga
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
                Pilih kebutuhan medis atau administrasi kesehatan Anda di bawah ini untuk langsung
                membuat tiket pelayanan.
              </p>
            </div>
            <Link
              to="/regulasi"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-red-700 hover:text-red-800"
            >
              Lihat Daftar Tarif & SOP Lengkap
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {coreServices.map((srv) => {
              const Icon = srv.icon;
              return (
                <Link
                  key={srv.num}
                  to={`/layanan?tab=${encodeURIComponent(srv.tab)}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 transition hover:border-red-700 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-red-700">
                        {srv.num}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-800 shadow-2xs transition group-hover:bg-red-800 group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="mt-4 font-heading text-sm font-bold text-slate-900 group-hover:text-red-800">
                      {srv.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{srv.desc}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs">
                    <span className="font-mono font-bold text-slate-800">{srv.price}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-red-800">
                      Ajukan
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. GALERI FASILITAS & ARMADA MEDIS RS KOTA BARU                   */}
      {/* ================================================================= */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-red-700">
                <Camera className="h-3.5 w-3.5" />
                Dokumentasi & Fasilitas
              </p>
              <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
                Galeri Rumah Sakit Kota Baru
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
                Tinjau kesiapan fasilitas ruang perawatan, unit gawat darurat, dan armada evakuasi
                medis kami. Klik foto untuk melihat detail.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOSPITAL_GALLERY.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGallery(item)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                  <img
                    src={item.imageUrl}
                    alt={item.judul}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-red-900/90 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                    {item.kategori}
                  </span>
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-red-700">
                    <MapPin className="h-3 w-3" />
                    {item.lokasi}
                  </p>
                  <h3 className="mt-1 font-heading text-base font-bold text-slate-900 group-hover:text-red-800">
                    {item.judul}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {item.deskripsi}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. SARAN TAMBAHAN: PANDUAN ALUR PERTOLONGAN DARURAT WARGA         */}
      {/* ================================================================= */}
      <section className="bg-slate-900 py-14 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-red-800/60 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-200">
              Panduan Keselamatan Warga
            </span>
            <h2 className="mt-3 font-heading text-2xl font-extrabold sm:text-3xl">
              Prosedur Saat Menghadapi Keadaan Darurat Medis
            </h2>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="font-mono text-sm font-extrabold text-amber-300">LANGKAH 01</span>
              <h3 className="mt-2 font-heading text-base font-bold">
                Kirim Sinyal Darurat & Lokasi
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Gunakan fitur panggilan darurat pada ponsel kota Anda dan pastikan titik koordinat
                GPS korban terlihat jelas oleh petugas.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="font-mono text-sm font-extrabold text-amber-300">LANGKAH 02</span>
              <h3 className="mt-2 font-heading text-base font-bold">
                Amankan Area & Beri Ruang Medis
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Jauhkan kendaraan dari korban dan pastikan lokasi bebas dari baku tembak atau
                bahaya aktif sebelum tim paramedis merapat.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="font-mono text-sm font-extrabold text-amber-300">LANGKAH 03</span>
              <h3 className="mt-2 font-heading text-base font-bold">
                Perawatan Lanjutan di Pillbox
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Pasien dengan luka tembak, patah tulang, atau trauma berat akan dievakuasi ke
                Pillbox Medical Center (Koordinat 201) untuk operasi pemulihan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. KOTAK KELUHAN & ASPIRASI WARGA (LANGSUNG DI HALAMAN UTAMA)     */}
      {/* ================================================================= */}
      <section id="kotak-keluhan" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10 lg:grid-cols-12">
            {/* Informasi Kiri */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-800">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-red-700">
                  Suara Warga Kota Baru
                </p>
                <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-950">
                  Kotak Keluhan & Aspirasi Warga
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Punya masukan terkait pelayanan paramedis, kritik konstruktif, apresiasi dokter,
                  atau laporan pelanggaran SOP? Sampaikan langsung kepada jajaran Direksi & HRD
                  Rumah Sakit Kota Baru.
                </p>

                <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-800" />
                    <p className="text-slate-600">
                      <strong className="text-slate-900">Privasi Terjamin:</strong> Anda dapat
                      mengaktifkan opsi <em>Kirim sebagai Anonim</em> tanpa mencantumkan nama.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-slate-600">
                      <strong className="text-slate-900">Ditinjau Langsung Petinggi:</strong> Setiap
                      laporan otomatis masuk ke sistem audit manajemen RS-KBR.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4">
                <Link
                  to="/keluhan"
                  className="text-xs font-bold text-red-800 hover:underline"
                >
                  Buka Halaman Keluhan Lengkap dengan Lampiran Bukti Gambar →
                </Link>
              </div>
            </div>

            {/* Formulir Kanan */}
            <form onSubmit={handleQuickComplaint} className="space-y-4 lg:col-span-7">
              {complaintSuccess && (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    Laporan / aspirasi Anda berhasil dikirim ke Manajemen RS Kota Baru!
                  </span>
                  <button type="button" onClick={() => setComplaintSuccess(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori Pengaduan *
                  </label>
                  <select
                    value={jenisPengaduan}
                    onChange={(e) =>
                      setJenisPengaduan(e.target.value as CitizenComplaint['jenisPengaduan'])
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-red-700 focus:outline-none"
                  >
                    <option>Laporan / Keluhan</option>
                    <option>Kritik & Saran</option>
                    <option>Apresiasi Pelayanan</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nama Warga (Opsional)
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-red-800">
                      <input
                        type="checkbox"
                        checked={anonim}
                        onChange={(e) => setAnonim(e.target.checked)}
                        className="accent-red-800"
                      />
                      Anonim
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={anonim}
                    value={anonim ? '' : namaPelapor}
                    onChange={(e) => setNamaPelapor(e.target.value)}
                    placeholder={anonim ? 'Identitas disembunyikan' : 'Nama IC Anda (atau kosongkan)'}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm disabled:bg-slate-100 focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subjek / Topik Laporan *
                </label>
                <input
                  type="text"
                  required
                  value={subjek}
                  onChange={(e) => setSubjek(e.target.value)}
                  placeholder="Contoh: Apresiasi respon cepat tim IGD / Saran jam buka poli..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Detail Kronologi / Aspirasi *
                </label>
                <textarea
                  rows={4}
                  required
                  value={kronologi}
                  onChange={(e) => setKronologi(e.target.value)}
                  placeholder="Tuliskan detail kronologi, waktu kejadian, lokasi, atau saran Anda..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-red-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-800 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-red-900"
              >
                <Send className="h-4 w-4" />
                Kirim ke Kotak Keluhan Warga
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* MODAL LIGHTBOX GALERI                                             */}
      {/* ================================================================= */}
      {selectedGallery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setSelectedGallery(null)}
        >
          <div
            className="relative max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGallery(null)}
              className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={selectedGallery.imageUrl}
              alt={selectedGallery.judul}
              className="h-72 w-full object-cover sm:h-80"
            />
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-800">
                  {selectedGallery.kategori}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {selectedGallery.lokasi}
                </span>
              </div>
              <h3 className="mt-2 font-heading text-xl font-extrabold text-slate-900">
                {selectedGallery.judul}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {selectedGallery.deskripsi}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}