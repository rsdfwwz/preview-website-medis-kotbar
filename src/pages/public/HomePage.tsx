import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ambulance,
  ArrowRight,
  ArrowUpRight,
  Award,
  Brain,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  HeartHandshake,
  HeartPulse,
  MapPin,
  MessageSquareWarning,
  PhoneCall,
  Pill,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import type { CitizenComplaint } from '@/types';

interface GalleryItem {
  id: string;
  judul: string;
  kategori: string;
  lokasi: string;
  deskripsi: string;
  imageUrl: string;
}

interface CoreServiceCard {
  categoryTag: string;
  title: string;
  desc: string;
  bullets?: string[];
  buttonLabel: string;
  showButtonIcon?: boolean;
  tab: string;
  icon: React.ElementType;
  accentClass: string;
}

// =========================================================================
// KONFIGURASI GAMBAR GALERI (Ganti path/URL di sini sesuai keinginanmu)
// Tips: Simpan foto di folder "public/gallery/..." lalu tulis "/gallery/nama.jpg"
// =========================================================================
const GALLERY_IMAGES = {
  gedungUtama:
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80',
  igdTrauma:
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
  armadaMedis:
    'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1200&q=80',
  bedahPlastik:
    'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80',
  farmasi:
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=1200&q=80',
  psikologiIshihara:
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
} as const;

const HOSPITAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    judul: 'Gedung Utama Pillbox Medical Center',
    kategori: 'Fasilitas Utama',
    lokasi: 'Koordinat 201 · Pusat Kota Baru',
    deskripsi:
      'Pusat pelayanan kesehatan terpadu 24 jam dengan akses lobi triase cepat dan jalur khusus ambulans.',
    imageUrl: GALLERY_IMAGES.gedungUtama,
  },
  {
    id: 'gal-2',
    judul: 'Unit Gawat Darurat (IGD) & Ruang Trauma',
    kategori: 'Pelayanan Kritis',
    lokasi: 'Lantai 1 · Sayap Timur Pillbox',
    deskripsi:
      'Dilengkapi monitor hemodinamik modern dan peralatan resusitasi untuk penanganan korban kecelakaan berat.',
    imageUrl: GALLERY_IMAGES.igdTrauma,
  },
  {
    id: 'gal-3',
    judul: 'Armada Ambulans & Evakuasi Udara (Heli Medis)',
    kategori: 'Tim Reaksi Cepat',
    lokasi: 'Helipad & Garasi Utama RS-KBRP',
    deskripsi:
      'Unit darat dan helikopter evakuasi siap menjangkau wilayah pegunungan, pelabuhan, maupun jalan tol kota.',
    imageUrl: GALLERY_IMAGES.armadaMedis,
  },
  {
    id: 'gal-4',
    judul: 'Ruang Bedah Plastik & Rekonstruksi Estetika',
    kategori: 'Poli Spesialis',
    lokasi: 'Lantai 2 · Klinik Spesialis',
    deskripsi:
      'Ruang operasi steril berstandar tinggi untuk tindakan bedah rekonstruksi wajah dan klaim benefit SKWB.',
    imageUrl: GALLERY_IMAGES.bedahPlastik,
  },
  {
    id: 'gal-5',
    judul: 'Instalasi Farmasi & Apotek 24 Jam',
    kategori: 'Farmasi & Obat',
    lokasi: 'Lobi Utama · Loket Farmasi',
    deskripsi:
      'Penyediaan paket perban medis, vitamin pemulihan, dan obat antidepresan resmi Rumah Sakit Kota Baru (KBRP).',
    imageUrl: GALLERY_IMAGES.farmasi,
  },
  {
    id: 'gal-6',
    judul: 'Ruang Diagnostik Psikologi & Tes Ishihara',
    kategori: 'Administrasi Instansi',
    lokasi: 'Lantai 2 · Poli Evaluasi',
    deskripsi:
      'Fasilitas pengujian kesehatan jasmani, tes buta warna 20 lempeng Ishihara, dan evaluasi psikologi resmi.',
    imageUrl: GALLERY_IMAGES.psikologiIshihara,
  },
];

interface ComplaintCategoryDropdownProps {
  value: CitizenComplaint['jenisPengaduan'];
  onChange: (val: CitizenComplaint['jenisPengaduan']) => void;
}

const COMPLAINT_CATEGORIES: {
  value: CitizenComplaint['jenisPengaduan'];
  desc: string;
}[] = [
  {
    value: 'Laporan / Keluhan',
    desc: 'Pengaduan insiden, waktu tunggu, atau ketidaksesuaian prosedur',
  },
  {
    value: 'Kritik & Saran',
    desc: 'Masukan perbaikan sistem, alur layanan, atau fasilitas RS',
  },
  {
    value: 'Apresiasi Pelayanan',
    desc: 'Ucapan terima kasih atau pujian untuk kinerja tim medis',
  },
];

function ComplaintCategoryDropdown({ value, onChange }: ComplaintCategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative mt-1.5 w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm font-medium text-slate-900 transition ${
          open
            ? 'border-[#8B1515] ring-2 ring-red-100'
            : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-950/5">
          {COMPLAINT_CATEGORIES.map((item) => {
            const isSelected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                  isSelected
                    ? 'bg-red-50 text-[#8B1515]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{item.value}</p>
                  <p className="truncate text-[10px] text-slate-400">{item.desc}</p>
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

export function HomePage() {
  const { staffList, submitComplaint } = usePortal();

  // State Lightbox Galeri & status gagal muat per item
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);
  const [brokenGalleryIds, setBrokenGalleryIds] = useState<Record<string, boolean>>({});

  // State Form Kotak Keluhan Warga
  const [jenisPengaduan, setJenisPengaduan] =
    useState<CitizenComplaint['jenisPengaduan']>('Laporan / Keluhan');
  const [anonim, setAnonim] = useState(false);
  const [namaPelapor, setNamaPelapor] = useState('');
  const [subjek, setSubjek] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const activeStaffCount = (staffList ?? []).filter((s) => s.statusAkun === 'aktif').length;

  const coreServices: CoreServiceCard[] = [
    {
      categoryTag: '01. Administrasi Kesehatan',
      title: '01 — Surat Keterangan Sehat (SKS)',
      desc: 'Pemeriksaan kesehatan jasmani dan fisik menyeluruh untuk keperluan:',
      bullets: [
        'Syarat melamar pekerjaan instansi resmi',
        'Pembuatan & perpanjangan lisensi kota',
        'Sertifikat medis terverifikasi QR Code',
      ],
      buttonLabel: 'Ajukan Surat Kesehatan',
      tab: 'Surat Kesehatan',
      icon: FileText,
      accentClass: 'text-red-700',
    },
    {
      categoryTag: '02. Konsultasi & Poli',
      title: '02 — Janji Temu Poli & Dokter',
      desc: 'Reservasi jadwal konsultasi maupun pemeriksaan lanjutan bersama tim medis:',
      bullets: [
        'Poli Umum & pemeriksaan kesehatan rutin',
        'Konsultasi dokter spesialis terjadwal',
        'Notifikasi panggilan otomatis via Discord',
      ],
      buttonLabel: 'Buat Janji Temu',
      tab: 'Janji Temu Poli',
      icon: Stethoscope,
      accentClass: 'text-sky-700',
    },
    {
      categoryTag: '03. Bedah Estetika',
      title: '03 — Operasi Plastik',
      desc: 'Layanan tindakan bedah estetika dan rekonstruksi penampilan warga:',
      bullets: [
        'Rekonstruksi wajah & penyesuaian penampilan',
        'Penanganan ruang bedah steril spesialis',
        'Gratis 1x bagi pemegang kartu SKWB aktif',
      ],
      buttonLabel: 'Ajukan Operasi Plastik',
      tab: 'Operasi Plastik',
      icon: Sparkles,
      accentClass: 'text-rose-700',
    },
    {
      categoryTag: '04. Diagnostik Visual',
      title: '04 — Tes Buta Warna',
      desc: 'Uji penglihatan warna menggunakan metode Ishihara (20 Lempeng Interaktif) secara gratis.',
      buttonLabel: 'Mulai Tes',
      tab: 'Tes Buta Warna',
      icon: Eye,
      accentClass: 'text-teal-700',
    },
    {
      categoryTag: '05. Kesehatan Mental',
      title: '05 — Tes Psikologi',
      desc: 'Pemeriksaan dan evaluasi kesehatan mental untuk:',
      bullets: [
        'Evaluasi mandiri & rekrutmen',
        'Lisensi / izin khusus',
        'Rujukan konsultasi & terapi medis',
      ],
      buttonLabel: 'Daftar Tes Psikologi',
      tab: 'Tes Psikologi',
      icon: Brain,
      accentClass: 'text-amber-700',
    },
    {
      categoryTag: '06. Layanan Warga Baru',
      title: 'Klaim Benefit SKWB',
      desc: 'Pendaftaran & klaim benefit kesehatan resmi 7 hari bagi pemegang Surat Keterangan Warga Baru (SKWB):',
      bullets: [
        'Free Operasi Plastik 1x',
        'Diskon 50% Layanan Treatment',
        'Gratis 1x Paket Perban',
      ],
      buttonLabel: 'Ajukan Klaim Benefit SKWB',
      tab: 'Klaim Benefit SKWB',
      icon: ShieldCheck,
      accentClass: 'text-emerald-700',
    },
    {
      categoryTag: '07. Forensik & Administrasi',
      title: 'Karakter Kill',
      desc: 'Layanan pengajuan dan pencatatan resmi kematian karakter (Character Kill / CK) serta administrasi pemakaman warga:',
      bullets: [
        'Pencatatan data diri & Citizen ID',
        'Laporan penyebab kematian & kronologi CK',
        'Pilihan pemakaman (Penguburan / Kremasi)',
      ],
      buttonLabel: 'Ajukan Karakter Kill',
      tab: 'Karakter Kill',
      icon: HeartHandshake,
      accentClass: 'text-red-800',
    },
    {
      categoryTag: '08. Farmasi & Logistik Medis',
      title: 'Loket Farmasi RS Kota Baru',
      desc: 'Isi form untuk membeli perban dan obat-obatan resmi di farmasi RS Kota Baru (KBRP):',
      bullets: [
        'Paket Perban (10 Pcs) — $20.000 KBRP',
        'Paket obat Antidepresan (5 Pcs) — $20.000 KBRP',
        'Paket Pengobatan — $40.000 KBRP',
        'Paket Penyembuhan — $45.000 KBRP',
      ],
      buttonLabel: 'Buka Layanan Farmasi',
      showButtonIcon: true,
      tab: 'Loket Farmasi',
      icon: Pill,
      accentClass: 'text-rose-800',
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

  const markGalleryBroken = (id: string) => {
    setBrokenGalleryIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ================================================================= */}
      {/* BAGIAN 1: HERO SECTION & KARTU AKSES CEPAT LAYANAN WARGA          */}
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
              Portal resmi Rumah Sakit Kota Baru (KBRP) untuk pengajuan surat kesehatan, janji temu
              poli spesialis, pemeriksaan psikologi, tes Ishihara gratis, hingga verifikasi keaslian
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
                Jadwal Praktik Dokter
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:max-w-lg">
              <div>
                <p className="font-heading text-2xl font-extrabold text-white">24 / 7</p>
                <p className="text-[11px] text-red-200">Layanan Gawat Darurat</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-extrabold text-amber-300">
                  {activeStaffCount} Staff
                </p>
                <p className="text-[11px] text-red-200">Tenaga Medis Terdaftar</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-extrabold text-white">8 Modul</p>
                <p className="text-[11px] text-red-200">Layanan Mandiri Warga</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3.5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                    RS Kota Baru (KBRP)
                  </p>
                  <h2 className="mt-0.5 font-heading text-base font-extrabold text-white">
                    Akses Cepat Layanan Warga
                  </h2>
                </div>
                <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-[11px] font-bold text-amber-200">
                  Layanan 24 Jam
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                <Link
                  to="/layanan?tab=Surat%20Kesehatan"
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-amber-300/40 hover:bg-black/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Surat Keterangan Sehat</p>
                      <p className="text-[11px] text-red-100/75">
                        Pengajuan sertifikat sehat resmi RS Kota Baru
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-red-200 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-300" />
                </Link>

                <Link
                  to="/layanan?tab=Janji%20Temu%20Poli"
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-amber-300/40 hover:bg-black/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Janji Temu Poli</p>
                      <p className="text-[11px] text-red-100/75">
                        Jadwal konsultasi dokter & panggilan Discord
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-red-200 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-300" />
                </Link>

                <Link
                  to="/layanan?tab=Loket%20Farmasi"
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-amber-300/40 hover:bg-black/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Loket Farmasi</p>
                      <p className="text-[11px] text-red-100/75">
                        Pemesanan paket perban & obat pemulihan warga
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-red-200 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-300" />
                </Link>

                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <Link
                    to="/layanan?tab=Klaim%20Benefit%20SKWB"
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs font-bold text-white transition hover:border-amber-300/40 hover:bg-black/30"
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                    <span className="truncate">Benefit SKWB</span>
                  </Link>

                  <Link
                    to="/verify"
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs font-bold text-white transition hover:border-amber-300/40 hover:bg-black/30"
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                    <span className="truncate">Cek Keaslian Surat</span>
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3.5 text-xs">
                <span className="flex items-center gap-1.5 text-red-100">
                  <PhoneCall className="h-3.5 w-3.5 text-amber-300" />
                  Hotline Darurat Kota: <strong>911 / EMS</strong>
                </span>
                <span className="flex items-center gap-1 font-bold text-amber-300">
                  <MapPin className="h-3.5 w-3.5" />
                  Pillbox · Koord. 201
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BAGIAN 2: MISI & KOMITMEN PELAYANAN KOTA BARU                    */}
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
                  sesuai SOP Rumah Sakit Kota Baru (KBRP).
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
      {/* BAGIAN 3: MENGAPA MEMILIH KAMI                                    */}
      {/* ================================================================= */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              Keunggulan Layanan RS-KBRP
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900">
                Tenaga Medis Bersertifikasi
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Ditangani langsung oleh dokter, spesialis, dan paramedis terlatih yang
                terverifikasi sesuai standar klinis Rumah Sakit Kota Baru.
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
      {/* BAGIAN 4: FITUR LAYANAN UTAMA WARGA                               */}
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

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreServices.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.categoryTag}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:border-red-200 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-xs font-semibold ${srv.accentClass}`}>
                        {srv.categoryTag}
                      </span>
                      <Icon className={`h-5 w-5 shrink-0 ${srv.accentClass}`} />
                    </div>

                    <h3 className="mt-3 font-heading text-lg font-extrabold text-slate-900">
                      {srv.title}
                    </h3>

                    <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {srv.desc}
                    </p>

                    {srv.bullets && srv.bullets.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-500">
                        {srv.bullets.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-6 pt-2">
                    <Link
                      to={`/layanan?tab=${encodeURIComponent(srv.tab)}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-4 py-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#6D0E0E]"
                    >
                      {srv.showButtonIcon && <Pill className="h-3.5 w-3.5" />}
                      {srv.buttonLabel}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BAGIAN 5: GALERI FASILITAS & ARMADA RS KOTA BARU (KBRP)            */}
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
            {HOSPITAL_GALLERY.map((item) => {
              const isBroken = Boolean(brokenGalleryIds[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGallery(item)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100">
                    {!isBroken ? (
                      <img
                        src={item.imageUrl}
                        alt={item.judul}
                        onError={() => markGalleryBroken(item.id)}
                        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 px-4 text-center text-slate-400">
                        <Camera className="h-6 w-6 text-red-800/50" />
                        <span className="text-[11px] font-semibold text-slate-500">
                          Gambar belum dimuat
                        </span>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-red-900/90 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                      {item.kategori}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-red-700">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.lokasi}</span>
                    </p>
                    <h3 className="mt-1 font-heading text-base font-bold text-slate-900 group-hover:text-red-800">
                      {item.judul}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {item.deskripsi}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BAGIAN 6: PANDUAN PERTOLONGAN DARURAT WARGA                        */}
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
      {/* BAGIAN 7: KOTAK KELUHAN & ASPIRASI WARGA                          */}
      {/* ================================================================= */}
      <section id="kotak-keluhan" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10 lg:grid-cols-12">
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
                  Rumah Sakit Kota Baru (KBRP).
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
                      laporan otomatis masuk ke sistem audit manajemen RS-KBRP.
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

            <form onSubmit={handleQuickComplaint} className="space-y-4 lg:col-span-7">
              {complaintSuccess && (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    Laporan / aspirasi Anda berhasil dikirim ke Manajemen RS Kota Baru (KBRP)!
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
                  <ComplaintCategoryDropdown
                    value={jenisPengaduan}
                    onChange={setJenisPengaduan}
                  />
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
      {/* BAGIAN 8: MODAL LIGHTBOX GALERI                                   */}
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
            {!brokenGalleryIds[selectedGallery.id] ? (
              <img
                src={selectedGallery.imageUrl}
                alt={selectedGallery.judul}
                onError={() => markGalleryBroken(selectedGallery.id)}
                className="aspect-[16/10] w-full object-cover object-center"
              />
            ) : (
              <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
                <Camera className="h-8 w-8 text-red-800/50" />
                <span className="text-xs font-semibold">Gambar belum tersedia</span>
              </div>
            )}
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

export default HomePage;