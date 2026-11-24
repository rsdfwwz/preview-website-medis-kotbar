import React from 'react';
import { ROLE_LEVELS, type RoleName } from '@/types';
import {
  BULAN_INDO,
  HOURLY_RATE_BELOW_TARGET,
  OVERTIME_BONUS_PER_HALF_HOUR,
} from './constants';
import type { LetterFontStyle, LetterTemplateId, OfficialLetterDraft } from './types';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseLogDate(raw: string): Date | null {
  if (!raw) return null;
  const datePart = raw.trim().split(/[T\s]/)[0];
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

export function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatWeekRangeLabel(start: Date, end: Date): string {
  const sDay = start.getDate();
  const eDay = end.getDate();
  const sMonth = BULAN_INDO[start.getMonth()].slice(0, 3);
  const eMonth = BULAN_INDO[end.getMonth()].slice(0, 3);
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    return `${sDay} – ${eDay} ${sMonth} ${year}`;
  }
  return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`;
}

export function getTargetJamMingguan(role: RoleName): number {
  const level = ROLE_LEVELS[role] || 1;
  if (level <= 1) return 10;
  if (level === 2) return 12;
  if (level === 3) return 15;
  if (level <= 5) return 17;
  return 20;
}

export function getFullTargetSalary(role: RoleName): number {
  return (ROLE_LEVELS[role] || 1) * 115000 + 102000;
}

export function computeWeeklySalary(role: RoleName, menitMingguan: number, targetJam: number) {
  const safeMinutes = Math.max(0, menitMingguan);
  if (safeMinutes <= 0) {
    return {
      pokok: 0,
      bonus: 0,
      total: 0,
      otKelipatan: 0,
      isTargetReached: false,
    };
  }

  const targetMenit = targetJam * 60;
  const isTargetReached = safeMinutes >= targetMenit;

  if (!isTargetReached) {
    const pokokProporsional = Math.round((safeMinutes / 60) * HOURLY_RATE_BELOW_TARGET);
    return {
      pokok: pokokProporsional,
      bonus: 0,
      total: pokokProporsional,
      otKelipatan: 0,
      isTargetReached: false,
    };
  }

  const pokok = getFullTargetSalary(role);
  const otHours = Math.max(0, (safeMinutes - targetMenit) / 60);
  const otKelipatan = Math.floor(otHours * 2);
  const bonus = otKelipatan * OVERTIME_BONUS_PER_HALF_HOUR;

  return {
    pokok,
    bonus,
    total: pokok + bonus,
    otKelipatan,
    isTargetReached: true,
  };
}

export function renderFormattedBoldText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return React.createElement(
        'strong',
        { key: idx, className: 'font-bold text-slate-950' },
        part.slice(2, -2)
      );
    }
    return React.createElement(React.Fragment, { key: idx }, part);
  });
}

export function sanitizeFilePart(raw: string): string {
  return (
    raw
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'Surat_Resmi_RSKB'
  );
}

export function createDefaultLetterByTemplate(
  templateId: LetterTemplateId,
  signerNameFallback: string,
  signerRoleFallback: string
): OfficialLetterDraft {
  const baseKop = {
    judulInstansi: 'RUMAH SAKIT KOTABARU ROLEPLAY',
    subjudulRumahSakit: 'RUMAH SAKIT PILLBOX MEDICAL CENTER',
    alamatKop: 'Alamat: Pillbox Medical Center, Koordinat 201 — KotaBaru Roleplay',
    kotaTanggal: 'KotaBaru, 1 November 2026',
    gayaHuruf: 'serif' as LetterFontStyle,
  };

  if (templateId === 'mou_medis') {
    return {
      id: `draft-${Date.now()}`,
      savedAt: new Date().toLocaleString('id-ID'),
      templateId,
      ...baseKop,
      nomorSurat: '005/MOU/RSKB/XI/2026',
      lampiran: '1 (Satu) Berkas Lampiran Paket Layanan',
      perihal: 'Nota Kesepahaman (MoU) Layanan Kesehatan & Tanggap Darurat',
      tujuanPrefix: 'Kepada Yth.',
      tujuanUtama: 'Pimpinan / Direksi Mitra Perusahaan',
      tujuanLokasi: 'Di Tempat',
      salamPembuka: 'Dengan hormat,',
      paragrafPembuka:
        'Sehubungan dengan komitmen peningkatan kesejahteraan dan kesiapsiagaan kesehatan kerja, pihak **Paramedic KotaBaru Roleplay (Pihak Pertama)** bermaksud mengajukan Nota Kesepahaman layanan medis kepada pihak **Mitra Perusahaan / Komunitas (Pihak Kedua)**.',
      sections: [
        {
          id: 'sec-mou-1',
          type: 'table',
          title: 'A. KETENTUAN PAKET LAYANAN KESEHATAN MITRA',
          intro:
            'Pihak Pertama menyediakan layanan medis dan dukungan kesehatan dengan rincian sebagai berikut:',
          columns: ['No', 'Jenis Layanan Medis', 'Kesepakatan', 'Keterangan'],
          rows: [
            {
              id: 'r-m1',
              cells: [
                '1',
                'Pemeriksaan Kesehatan & Surat Keterangan Sehat',
                'Prioritas Antrean Poli',
                'Berlaku bagi karyawan terdaftar pada data mitra.',
              ],
            },
            {
              id: 'r-m2',
              cells: [
                '2',
                'Paket Obat & Perbekalan Medis Rutin',
                'Diskon 15%',
                'Pengambilan di Loket Farmasi Pillbox Medical Center.',
              ],
            },
          ],
          content: '',
          bullets: [],
        },
        {
          id: 'sec-mou-2',
          type: 'callout',
          title: 'Syarat & Ketentuan Pelaksanaan MoU:',
          intro: '',
          columns: [],
          rows: [],
          content:
            'Seluruh layanan dalam MoU ini berlaku setelah berkas ditandatangani oleh kedua belah pihak dan diverifikasi oleh administrasi **Rumah Sakit Pillbox Medical Center (Koordinat 201)**.',
          bullets: [],
        },
      ],
      paragrafPenutup:
        'Demikian surat pengajuan nota kesepahaman ini kami sampaikan. Atas perhatian, kesediaan, dan kerjasama yang baik dari Pihak Kedua, kami ucapkan terima kasih.',
      signers: [
        {
          id: 's-m1',
          labelAtas: 'Penanggung Jawab Kontrak',
          kosongkanNama: false,
          namaPenandatangan: 'Yuzuriha M Bimantara',
          jabatanPenandatangan: 'HRD Rumah Sakit',
        },
        {
          id: 's-m2',
          labelAtas: 'Persetujuan Pihak Pertama',
          kosongkanNama: false,
          namaPenandatangan: signerNameFallback || 'Antonio Vermilion Century',
          jabatanPenandatangan: signerRoleFallback || 'Direktur Rumah Sakit',
        },
        {
          id: 's-m3',
          labelAtas: 'Persetujuan Pihak Kedua',
          kosongkanNama: true,
          namaPenandatangan: '',
          jabatanPenandatangan: 'Pimpinan Mitra Perusahaan',
        },
      ],
      footerText: 'Paramedic KotaBaru Roleplay — Surat Pengajuan Nota Kesepahaman Medis',
    };
  }

  if (templateId === 'surat_edaran') {
    return {
      id: `draft-${Date.now()}`,
      savedAt: new Date().toLocaleString('id-ID'),
      templateId,
      ...baseKop,
      nomorSurat: '009/SE/RSKB/XI/2026',
      lampiran: '-',
      perihal: 'Pengumuman Resmi Operasional & Ketertiban Pelayanan Medis',
      tujuanPrefix: 'Kepada Yth.',
      tujuanUtama: 'Seluruh Tenaga Medis & Masyarakat KotaBaru',
      tujuanLokasi: 'Di Tempat',
      salamPembuka: 'Dengan hormat,',
      paragrafPembuka:
        'Dalam rangka menjaga mutu pelayanan kesehatan serta ketertiban administrasi di lingkungan **Rumah Sakit KotaBaru Roleplay**, bersama ini disampaikan ketentuan resmi sebagai berikut:',
      sections: [
        {
          id: 'sec-ed-1',
          type: 'list',
          title: 'A. POKOK KETENTUAN EDARAN RESMI',
          intro: 'Seluruh personel dan pengguna layanan wajib memperhatikan poin-poin berikut:',
          columns: [],
          rows: [],
          content: '',
          bullets: [
            'Setiap tindakan medis, pemeriksaan, dan penerbitan surat resmi wajib tercatat dengan data identitas yang jelas.',
            'Pelayanan gawat darurat dan evakuasi diprioritaskan berdasarkan tingkat urgensi klinis di lapangan.',
            'Perubahan jadwal praktik maupun layanan farmasi diumumkan melalui kanal resmi instansi.',
          ],
        },
        {
          id: 'sec-ed-2',
          type: 'callout',
          title: 'Catatan Pelaksanaan:',
          intro: '',
          columns: [],
          rows: [],
          content:
            'Surat edaran ini mulai berlaku sejak tanggal ditetapkan hingga terdapat pemberitahuan pembaruan lebih lanjut dari **Jajaran Petinggi RS KotaBaru**.',
          bullets: [],
        },
      ],
      paragrafPenutup:
        'Demikian surat edaran ini kami sampaikan. Atas perhatian, kesediaan, dan kerjasama yang baik, kami ucapkan terima kasih.',
      signers: [
        {
          id: 's-e1',
          labelAtas: 'Ditetapkan di KotaBaru',
          kosongkanNama: false,
          namaPenandatangan: signerNameFallback || 'Antonio Vermilion Century',
          jabatanPenandatangan: signerRoleFallback || 'Direktur Rumah Sakit',
        },
      ],
      footerText: 'Paramedic KotaBaru Roleplay — Surat Edaran & Pengumuman Resmi',
    };
  }

  if (templateId === 'surat_tugas') {
    return {
      id: `draft-${Date.now()}`,
      savedAt: new Date().toLocaleString('id-ID'),
      templateId,
      ...baseKop,
      nomorSurat: '014/ST/RSKB/XI/2026',
      lampiran: '1 (Satu) Lembar Rincian Penugasan',
      perihal: 'Surat Tugas & Penunjukan Resmi Pelaksanaan Tugas Medis',
      tujuanPrefix: 'Kepada Yth.',
      tujuanUtama: 'Personel Medis Tertugas',
      tujuanLokasi: 'Di Tempat',
      salamPembuka: 'Dengan hormat,',
      paragrafPembuka:
        'Yang bertanda tangan di bawah ini memberikan **Surat Tugas Resmi** kepada personel medis yang namanya tercantum di bawah ini untuk melaksanakan tugas sesuai arahan instansi:',
      sections: [
        {
          id: 'sec-st-1',
          type: 'table',
          title: 'A. RINCIAN PERSONEL & PENUGASAN',
          intro: 'Personel yang ditugaskan wajib menjalankan prosedur sesuai SOP medis yang berlaku:',
          columns: ['No', 'Nama / Jabatan', 'Uraian Tugas', 'Keterangan'],
          rows: [
            {
              id: 'r-s1',
              cells: [
                '1',
                signerNameFallback || 'dr. Levi Vance Harrington, S.Ked',
                'Koordinator Tim Medis & Pelaporan',
                'Wajib melaporkan hasil tugas setelah selesai.',
              ],
            },
          ],
          content: '',
          bullets: [],
        },
        {
          id: 'sec-st-2',
          type: 'paragraph',
          title: 'B. TANGGUNG JAWAB PELAKSANAAN',
          intro: '',
          columns: [],
          rows: [],
          content:
            'Selama menjalankan tugas, personel wajib menjaga nama baik **Paramedic KotaBaru Roleplay**, mengutamakan keselamatan pasien, serta berkoordinasi dengan unit terkait apabila terjadi kondisi darurat.',
          bullets: [],
        },
      ],
      paragrafPenutup:
        'Demikian surat tugas ini kami sampaikan. Atas perhatian, kesediaan, dan kerjasama yang baik, kami ucapkan terima kasih.',
      signers: [
        {
          id: 's-t1',
          labelAtas: 'Pemberi Tugas',
          kosongkanNama: false,
          namaPenandatangan: signerNameFallback || 'Yuzuriha M Bimantara',
          jabatanPenandatangan: signerRoleFallback || 'HRD Rumah Sakit',
        },
      ],
      footerText: 'Paramedic KotaBaru Roleplay — Surat Tugas & Penunjukan Resmi Staff',
    };
  }

  return {
    id: `draft-${Date.now()}`,
    savedAt: new Date().toLocaleString('id-ID'),
    templateId: 'kontrak_kerjasama',
    ...baseKop,
    nomorSurat: '002/SPK/RSKB/XI/2026',
    lampiran: '1 (Satu) Berkas Draf Kerjasama',
    perihal: 'Pengajuan Kontrak Kerjasama Keamanan & Fasilitas Medis',
    tujuanPrefix: 'Kepada Yth.',
    tujuanUtama: 'Jendral KotaBaru Police Department',
    tujuanLokasi: 'Di Tempat',
    salamPembuka: 'Dengan hormat,',
    paragrafPembuka:
      'Sehubungan dengan upaya peningkatan efisiensi operasional serta jaminan keamanan harian bagi seluruh staf dan karyawan medis, pihak **Paramedic KotaBaru Roleplay (Pihak Pertama)** bermaksud mengajukan penawaran kontrak kerjasama pasokan keamanan kepada pihak **KotaBaru Police Department (Pihak Kedua)**.',
    sections: [
      {
        id: 'sec-k1',
        type: 'table',
        title: 'A. KETENTUAN PASOKAN KEAMANAN KARYAWAN',
        intro:
          'Pihak Kedua memberikan pasokan Keamanan guna melindungi dan kebutuhan operasional karyawan Rumah Sakit KotaBaru Roleplay dengan rincian sebagai berikut:',
        columns: ['No', 'Item Pengadaan', 'Kesepakatan', 'Keterangan'],
        rows: [
          {
            id: 'r-k1',
            cells: [
              '1',
              'Taser',
              'Menyesuaikan karyawan EMS',
              '1. Taser 1 unit / orang karyawan medis\n2. Setelah ditunjukkan KTA resmi dan berseragam medis/duty.',
            ],
          },
          {
            id: 'r-k2',
            cells: ['2', 'Harga lisensi (senjata, berkendara)', 'Diskon 20%', ''],
          },
        ],
        content: '',
        bullets: [],
      },
      {
        id: 'sec-k2',
        type: 'table',
        title: 'B. IMBALAN & HAK FASILITAS MEDIS PIHAK KEPOLISIAN KOTABARU',
        intro:
          'Sebagai bentuk imbalan dan dukungan penuh kesehatan kerja, pihak Paramedic KotaBaru Roleplay memberikan jatah pasokan fasilitas medis harian kepada seluruh anggota Kepolisian KotaBaru:',
        columns: ['No', 'Jenis Paket Medis', 'Kesepakatan', 'Keterangan'],
        rows: [
          {
            id: 'r-k3',
            cells: [
              '1',
              '1 Paket Perban (Isi 10 Buah)',
              '1 Paket / Orang',
              'Pembelian berlaku 2x dalam Sehari',
            ],
          },
          {
            id: 'r-k4',
            cells: ['2', 'Melakukan evakuasi di tempat', 'Diskon 20%', ''],
          },
        ],
        content: '',
        bullets: [],
      },
      {
        id: 'sec-k3',
        type: 'callout',
        title: 'Syarat & Ketentuan Klaim Jatah Medis:',
        intro: '',
        columns: [],
        rows: [],
        content:
          'Seluruh anggota Kepolisian dapat mengambil jatah medis tersebut dengan syarat wajib datang langsung ke lokasi Rumah Sakit **Pillbox Medical Center (Koordinat 201)** serta menunjukkan **Kartu Tanda Anggota (KTA)** Kepolisian yang aktif kepada petugas medis yang bertugas.',
        bullets: [],
      },
    ],
    paragrafPenutup:
      'Demikian surat pengajuan kontrak ini kami sampaikan. Atas perhatian, kesediaan, dan kerjasama yang baik dari Pihak Kedua, kami ucapkan terima kasih.',
    signers: [
      {
        id: 's-k1',
        labelAtas: 'Penanggung Jawab Kontrak',
        kosongkanNama: false,
        namaPenandatangan: 'Yuzuriha M Bimantara',
        jabatanPenandatangan: 'HRD Rumah Sakit',
      },
      {
        id: 's-k2',
        labelAtas: 'Persetujuan Pihak Pertama',
        kosongkanNama: false,
        namaPenandatangan: 'Antonio Vermilion Century',
        jabatanPenandatangan: 'Direktur Rumah Sakit',
      },
      {
        id: 's-k3',
        labelAtas: 'Persetujuan Pihak Kedua',
        kosongkanNama: true,
        namaPenandatangan: '',
        jabatanPenandatangan: 'Jendral KotaBaru Police Department',
      },
    ],
    footerText: 'Paramedic KotaBaru Roleplay — Surat Pengajuan Kontrak Kerja Sama',
  };
}