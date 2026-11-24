import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';

type IshiharaPaletteKey =
  | 'olive_on_violet'
  | 'red_on_green'
  | 'green_on_red'
  | 'orange_on_teal'
  | 'coral_on_sage'
  | 'vanishing_control';

export interface IshiharaPlateConfig {
  plateNumber: number;
  answer: string;
  options: string[];
  levelLabel: string;
  clinicalNote: string;
  paletteType: IshiharaPaletteKey;
  wrongIndication: string;
}

export interface IshiharaPlateAnswerDetail {
  plateNumber: number;
  chosenAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  paletteType: IshiharaPaletteKey;
  indicationIfWrong: string;
}

export const ISHIHARA_PLATES: IshiharaPlateConfig[] = [
  {
    plateNumber: 1,
    answer: '12',
    options: ['12', '17', '21', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 1: PENGENALAN',
    clinicalNote: 'Plat 1: Lempeng Pengenalan & Kalibrasi Kontras',
    paletteType: 'orange_on_teal',
    wrongIndication: 'Gangguan persepsi kontras dasar / kalibrasi visual',
  },
  {
    plateNumber: 2,
    answer: '4',
    options: ['4', '1', '7', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 1: KONTRAS TINGGI',
    clinicalNote: 'Plat 2: Uji Diskriminasi Kromatik Zaitun-Violet',
    paletteType: 'olive_on_violet',
    wrongIndication: 'Diskromatopsia parsial (diskriminasi zaitun–violet)',
  },
  {
    plateNumber: 3,
    answer: '8',
    options: ['3', '8', '6', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 1: KONTRAS TINGGI',
    clinicalNote: 'Plat 3: Uji Diskriminasi Spektrum Merah-Hijau',
    paletteType: 'red_on_green',
    wrongIndication: 'Defisiensi warna merah-hijau (spektrum protan / deutan)',
  },
  {
    plateNumber: 4,
    answer: '6',
    options: ['5', '6', '9', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 1: KONTRAS TINGGI',
    clinicalNote: 'Plat 4: Uji Diskriminasi Spektrum Hijau-Merah',
    paletteType: 'green_on_red',
    wrongIndication: 'Defisiensi warna merah-hijau (spektrum protan / deutan)',
  },
  {
    plateNumber: 5,
    answer: '29',
    options: ['29', '70', '20', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 1: KONTRAS TINGGI',
    clinicalNote: 'Plat 5: Uji Kromatik Dua Digit Dasar',
    paletteType: 'coral_on_sage',
    wrongIndication: 'Diskromatopsia parsial (kromatik dua digit)',
  },
  {
    plateNumber: 6,
    answer: '57',
    options: ['35', '57', '51', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 2: MENENGAH',
    clinicalNote: 'Plat 6: Uji Sensitivitas Kerucut L & M',
    paletteType: 'red_on_green',
    wrongIndication: 'Gangguan sensitivitas kerucut L & M (merah-hijau)',
  },
  {
    plateNumber: 7,
    answer: '5',
    options: ['2', '5', '8', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 2: MENENGAH',
    clinicalNote: 'Plat 7: Uji Diskriminasi Zaitun-Violet Lanjut',
    paletteType: 'olive_on_violet',
    wrongIndication: 'Diskromatopsia parsial (zaitun–violet lanjutan)',
  },
  {
    plateNumber: 8,
    answer: '3',
    options: ['3', '5', '8', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 2: MENENGAH',
    clinicalNote: 'Plat 8: Uji Sensitivitas Kerucut L & M',
    paletteType: 'green_on_red',
    wrongIndication: 'Gangguan sensitivitas kerucut L & M (merah-hijau)',
  },
  {
    plateNumber: 9,
    answer: '15',
    options: ['15', '17', '51', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 2: MENENGAH',
    clinicalNote: 'Plat 9: Uji Diskriminasi Kontras Sedang',
    paletteType: 'coral_on_sage',
    wrongIndication: 'Diskromatopsia parsial (kontras kromatik sedang)',
  },
  {
    plateNumber: 10,
    answer: '74',
    options: ['21', '74', '71', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 2: MENENGAH',
    clinicalNote: 'Plat 10: Uji Diskriminasi Protanopia / Deuteranopia',
    paletteType: 'red_on_green',
    wrongIndication: 'Defisiensi warna merah-hijau (protanopia / deuteranopia)',
  },
  {
    plateNumber: 11,
    answer: '2',
    options: ['2', '7', '9', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 2: MENENGAH',
    clinicalNote: 'Plat 11: Uji Ketajaman Persepsi Warna',
    paletteType: 'orange_on_teal',
    wrongIndication: 'Diskromatopsia parsial (ketajaman persepsi warna)',
  },
  {
    plateNumber: 12,
    answer: '6',
    options: ['6', '8', '0', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 3: PRESISI',
    clinicalNote: 'Plat 12: Uji Pseudo-Isokromatik Presisi',
    paletteType: 'olive_on_violet',
    wrongIndication: 'Diskromatopsia parsial (pseudo-isokromatik presisi)',
  },
  {
    plateNumber: 13,
    answer: '97',
    options: ['87', '97', '91', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 3: PRESISI',
    clinicalNote: 'Plat 13: Uji Pseudo-Isokromatik Presisi',
    paletteType: 'green_on_red',
    wrongIndication: 'Defisiensi warna merah-hijau (presisi spektral)',
  },
  {
    plateNumber: 14,
    answer: '45',
    options: ['45', '46', '15', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 3: PRESISI',
    clinicalNote: 'Plat 14: Uji Diferensiasi Hijau-Jingga',
    paletteType: 'coral_on_sage',
    wrongIndication: 'Diskromatopsia parsial (diferensiasi hijau–jingga)',
  },
  {
    plateNumber: 15,
    answer: '5',
    options: ['5', '6', '9', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 3: PRESISI',
    clinicalNote: 'Plat 15: Uji Diferensiasi Merah-Zaitun',
    paletteType: 'red_on_green',
    wrongIndication: 'Defisiensi warna merah-hijau (diferensiasi merah-zaitun)',
  },
  {
    plateNumber: 16,
    answer: '7',
    options: ['1', '7', '4', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 3: PRESISI',
    clinicalNote: 'Plat 16: Uji Kepekaan Warna Lanjut',
    paletteType: 'orange_on_teal',
    wrongIndication: 'Diskromatopsia parsial (kepekaan warna lanjutan)',
  },
  {
    plateNumber: 17,
    answer: '16',
    options: ['16', '18', '76', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 3: PRESISI',
    clinicalNote: 'Plat 17: Uji Kepekaan Warna Lanjut',
    paletteType: 'olive_on_violet',
    wrongIndication: 'Diskromatopsia parsial (kepekaan kromatik lanjutan)',
  },
  {
    plateNumber: 18,
    answer: 'Tidak Ada Angka',
    options: ['5', '12', '42', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 4: KONTROL',
    clinicalNote: 'Plat 18: Lempeng Kontrol Acak (Verifikasi Atensi & Validitas)',
    paletteType: 'vanishing_control',
    wrongIndication: 'Deviasi lempeng kontrol / inkonsistensi respons',
  },
  {
    plateNumber: 19,
    answer: '73',
    options: ['23', '73', '78', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 4: DIAGNOSTIK',
    clinicalNote: 'Plat 19: Diferensiasi Protan & Deutan',
    paletteType: 'green_on_red',
    wrongIndication: 'Defisiensi warna merah-hijau (diferensiasi protan & deutan)',
  },
  {
    plateNumber: 20,
    answer: '42',
    options: ['42', '24', '47', 'Tidak Ada Angka'],
    levelLabel: 'LEVEL 4: DIAGNOSTIK',
    clinicalNote: 'Plat 20: Evaluasi Akhir Kelayakan Visual',
    paletteType: 'coral_on_sage',
    wrongIndication: 'Diskromatopsia parsial (evaluasi akhir diskriminasi warna)',
  },
];

function IshiharaCanvasPlate({ plate }: { plate: IshiharaPlateConfig }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 340;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = size;
    maskCanvas.height = size;
    const mCtx = maskCanvas.getContext('2d');
    if (!mCtx) return;

    mCtx.fillStyle = '#000000';
    mCtx.fillRect(0, 0, size, size);

    if (plate.answer !== 'Tidak Ada Angka') {
      const isTwoDigits = plate.answer.length > 1;
      const fontSize = isTwoDigits ? 176 : 226;

      mCtx.save();
      mCtx.translate(size / 2, size / 2 + 6);
      if (isTwoDigits) {
        mCtx.scale(0.92, 1.04);
      }
      mCtx.textAlign = 'center';
      mCtx.textBaseline = 'middle';
      mCtx.font = `900 ${fontSize}px "Arial Black", "Plus Jakarta Sans", "Inter", sans-serif`;
      mCtx.lineJoin = 'round';
      mCtx.lineCap = 'round';
      mCtx.lineWidth = isTwoDigits ? 12 : 16;
      mCtx.strokeStyle = '#FFFFFF';
      mCtx.strokeText(plate.answer, 0, 0);
      mCtx.fillStyle = '#FFFFFF';
      mCtx.fillText(plate.answer, 0, 0);
      mCtx.restore();
    }

    const maskData = mCtx.getImageData(0, 0, size, size).data;

    const palettes: Record<IshiharaPaletteKey, { fg: string[]; bg: string[] }> = {
      olive_on_violet: {
        fg: ['#556522', '#64762B', '#768937', '#869A43', '#5C6D26', '#7F923E'],
        bg: ['#675599', '#7562A8', '#8673BA', '#9784CC', '#6E5CA0', '#8D7AC1'],
      },
      red_on_green: {
        fg: ['#C84632', '#D95640', '#E86A54', '#B83B28', '#E0604A', '#CE4E39'],
        bg: ['#577344', '#688553', '#7A9864', '#8CA975', '#607D4C', '#718E5B'],
      },
      green_on_red: {
        fg: ['#4D7A43', '#5E8D52', '#709F63', '#82B075', '#55834A', '#67965B'],
        bg: ['#C4523E', '#D5644E', '#E37761', '#B54532', '#CC5B46', '#DC6E58'],
      },
      orange_on_teal: {
        fg: ['#D95B26', '#E86E38', '#F2814B', '#C74E1C', '#E06530', '#EC7741'],
        bg: ['#456F6E', '#568280', '#689593', '#7BA7A5', '#4E7977', '#608C8A'],
      },
      coral_on_sage: {
        fg: ['#CE533D', '#DF654E', '#EC7861', '#BD4631', '#D65C45', '#E56F58'],
        bg: ['#677759', '#788969', '#8A9B7B', '#9BAD8C', '#708061', '#819272'],
      },
      vanishing_control: {
        fg: ['#688553'],
        bg: ['#577344', '#688553', '#7A9864', '#D5644E', '#E37761', '#8CA975'],
      },
    };

    const activePalette = palettes[plate.paletteType];

    let seed = plate.plateNumber * 104729 + 31337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const checkFigureCoverage = (cx: number, cy: number, cr: number): boolean => {
      if (plate.answer === 'Tidak Ada Angka') return false;
      const offsets = [
        [0, 0],
        [-0.5, 0],
        [0.5, 0],
        [0, -0.5],
        [0, 0.5],
        [-0.35, -0.35],
        [0.35, -0.35],
        [-0.35, 0.35],
        [0.35, 0.35],
      ];
      let insideCount = 0;
      for (const [ox, oy] of offsets) {
        const px = Math.min(size - 1, Math.max(0, Math.round(cx + ox * cr)));
        const py = Math.min(size - 1, Math.max(0, Math.round(cy + oy * cr)));
        const idx = (py * size + px) * 4;
        if (maskData[idx] > 128) insideCount++;
      }
      return insideCount >= 5;
    };

    interface DotCircle {
      x: number;
      y: number;
      r: number;
      isFigure: boolean;
    }

    const circles: DotCircle[] = [];
    const center = size / 2;
    const plateRadius = size / 2 - 6;

    const radiusTiers = [
      { r: 8.6, tries: 1100 },
      { r: 7.0, tries: 1300 },
      { r: 5.5, tries: 1600 },
      { r: 4.2, tries: 2000 },
      { r: 3.1, tries: 2400 },
      { r: 2.2, tries: 2800 },
    ];

    for (const tier of radiusTiers) {
      for (let i = 0; i < tier.tries; i++) {
        const r = tier.r + (rand() - 0.5) * 0.65;
        const theta = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand()) * (plateRadius - r - 0.5);
        const x = center + Math.cos(theta) * dist;
        const y = center + Math.sin(theta) * dist;

        let collision = false;
        for (let j = 0; j < circles.length; j++) {
          const other = circles[j];
          const dx = x - other.x;
          const dy = y - other.y;
          const minSep = r + other.r + 0.95;
          if (dx * dx + dy * dy < minSep * minSep) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          circles.push({
            x,
            y,
            r,
            isFigure: checkFigureCoverage(x, y, r),
          });
        }
      }
    }

    ctx.clearRect(0, 0, size, size);

    for (const dot of circles) {
      const pool = dot.isFigure ? activePalette.fg : activePalette.bg;
      const color = pool[Math.floor(rand() * pool.length)];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [plate]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[265px] w-[265px] rounded-full sm:h-[290px] sm:w-[290px]"
    />
  );
}

export interface IshiharaTestResultPayload {
  idHasil: string;
  tanggalPemeriksaan: string;
  namaPeserta: string;
  benar: number;
  salah: number;
  akurasiPersen: number;
  kategoriDiagnosis: string;
  kesimpulanMedis: string;
  redGreenCorrect: number;
  redGreenTotal: number;
  otherSpectrumCorrect: number;
  otherSpectrumTotal: number;
  controlPassed: boolean;
  plateDetails: IshiharaPlateAnswerDetail[];
}

interface IshiharaTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  onCompleteTest?: (result: IshiharaTestResultPayload) => void;
}

const PLATE_SECONDS = 12;

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function downloadIshiharaCertificateJpeg(result: IshiharaTestResultPayload) {
  const width = 1240;
  const height = 876;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Latar belakang krem/putih klinis
  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(0, 0, width, height);

  // Bingkai luar & dalam
  ctx.strokeStyle = '#8B1515';
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  ctx.strokeStyle = '#E2C5C5';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Header RS Kota Baru
  ctx.fillStyle = '#8B1515';
  ctx.fillRect(72, 72, width - 144, 112);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RS KOTA BARU — UNIT LAYANAN DIAGNOSTIK VISUAL', width / 2, 118);

  ctx.fillStyle = '#FDE8E8';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(
    'SERTIFIKAT HASIL UJI PENGLIHATAN WARNA (20 LEMPENG ISHIHARA)',
    width / 2,
    152
  );

  // Meta ID & Tanggal
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`NO. REKAM / ID : ${result.idHasil}`, 84, 224);
  ctx.textAlign = 'right';
  ctx.fillText(`TANGGAL TES : ${result.tanggalPemeriksaan}`, width - 84, 224);

  // Nama Peserta
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('DIBERIKAN KEPADA PESERTA', width / 2, 274);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText(result.namaPeserta.toUpperCase(), width / 2, 322);

  // Garis pemisah
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 348);
  ctx.lineTo(width - 180, 348);
  ctx.stroke();

  // Kotak Diagnosis Utama
  ctx.fillStyle = '#FEF2F2';
  ctx.fillRect(110, 372, width - 220, 128);
  ctx.strokeStyle = '#FECACA';
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 372, width - 220, 128);

  ctx.fillStyle = '#8B1515';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('KATEGORI DIAGNOSIS KLINIS', width / 2, 405);

  ctx.fillStyle = '#7F1D1D';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText(result.kategoriDiagnosis, width / 2, 446);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 17px monospace';
  ctx.fillText(
    `AKURASI: ${result.akurasiPersen}%   |   BENAR: ${result.benar}/20   |   SALAH: ${result.salah}/20`,
    width / 2,
    480
  );

  // Kesimpulan medis
  ctx.fillStyle = '#334155';
  ctx.font = '17px Arial, sans-serif';
  wrapCanvasText(ctx, result.kesimpulanMedis, width / 2, 542, width - 220, 26);

  // Rekap singkat nomor lempeng
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  const wrongPlates = result.plateDetails
    .filter((p) => !p.isCorrect)
    .map((p) => `#${p.plateNumber}`)
    .join(', ');
  ctx.fillText(
    `LEMPENG SALAH : ${wrongPlates || 'Tidak ada (Semua Benar)'}`,
    110,
    632
  );
  ctx.fillText(
    `SPEKTRUM MERAH-HIJAU : ${result.redGreenCorrect}/${result.redGreenTotal} BENAR   |   KONTROL PLAT #18 : ${result.controlPassed ? 'VALID' : 'PERLU VERIFIKASI'}`,
    110,
    658
  );

  // Footer Tanda Tangan & Status
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, 770);
  ctx.lineTo(420, 770);
  ctx.moveTo(width - 420, 770);
  ctx.lineTo(width - 140, 770);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('Petugas / Staf Medis RS Kota Baru', 280, 794);
  ctx.fillText('Status Verifikasi Dokumen', width - 280, 794);

  ctx.fillStyle = '#8B1515';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('TERCATAT — MENUNGGU ACC STAF', width - 280, 818);

  const link = document.createElement('a');
  const safeName = result.namaPeserta
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');
  link.download = `Sertifikat-Ishihara-${safeName || 'Peserta'}-${result.idHasil}.jpeg`;
  link.href = canvas.toDataURL('image/jpeg', 0.92);
  link.click();
}

export function evaluateIshiharaAnswers(
  namaPeserta: string,
  recordedAnswers: Record<number, string>
): IshiharaTestResultPayload {
  let benar = 0;
  let redGreenTotal = 0;
  let redGreenCorrect = 0;
  let otherSpectrumTotal = 0;
  let otherSpectrumCorrect = 0;
  let controlPassed = true;

  const plateDetails: IshiharaPlateAnswerDetail[] = ISHIHARA_PLATES.map((plate, idx) => {
    const chosenAnswer = recordedAnswers[idx] ?? 'Tidak Terjawab';
    const isCorrect = chosenAnswer === plate.answer;

    if (isCorrect) {
      benar++;
    }

    if (plate.paletteType === 'red_on_green' || plate.paletteType === 'green_on_red') {
      redGreenTotal++;
      if (isCorrect) redGreenCorrect++;
    } else if (plate.paletteType === 'vanishing_control') {
      if (!isCorrect) controlPassed = false;
    } else {
      otherSpectrumTotal++;
      if (isCorrect) otherSpectrumCorrect++;
    }

    return {
      plateNumber: plate.plateNumber,
      chosenAnswer,
      correctAnswer: plate.answer,
      isCorrect,
      paletteType: plate.paletteType,
      indicationIfWrong: plate.wrongIndication,
    };
  });

  const total = ISHIHARA_PLATES.length;
  const salah = total - benar;
  const akurasiPersen = Math.round((benar / total) * 100);
  const redGreenWrong = redGreenTotal - redGreenCorrect;
  const otherSpectrumWrong = otherSpectrumTotal - otherSpectrumCorrect;

  let kategoriDiagnosis = 'Penglihatan Warna Normal (Trikomasi Normal)';
  let kesimpulanMedis =
    'Respons persepsi warna pada seluruh lempeng Ishihara dalam batas normal (trikomasi normal) dengan kontrol valid.';

  if (benar <= 4 || (redGreenWrong >= 6 && otherSpectrumWrong >= 8)) {
    kategoriDiagnosis = 'Akromatopsia / Monokromasi (Indikasi Buta Warna Total)';
    kesimpulanMedis = `Terdapat gangguan diskriminasi warna menyeluruh (${salah}/${total} lempeng tidak tepat; merah-hijau salah ${redGreenWrong}/${redGreenTotal} dan lempeng kromatik lain salah ${otherSpectrumWrong}/${otherSpectrumTotal}), mengarah pada akromatopsia/monokromasi. Disarankan pemeriksaan oftalmologi lanjutan.`;
  } else if (redGreenWrong >= 4 && redGreenCorrect < otherSpectrumCorrect) {
    kategoriDiagnosis = 'Defisiensi Penglihatan Warna Merah-Hijau (Spektrum Protan / Deutan)';
    kesimpulanMedis = `Terdeteksi defisiensi dominan pada lempeng spektrum merah-hijau (${redGreenWrong}/${redGreenTotal} salah) yang berkaitan dengan sensitivitas fotoreseptor kerucut L dan M (protan/deutan).`;
  } else if (salah > 0) {
    kategoriDiagnosis = 'Defisiensi Penglihatan Warna Parsial (Diskromatopsia Parsial)';
    kesimpulanMedis = `Terdapat diskromatopsia parsial dengan ${salah}/${total} lempeng tidak tepat (merah-hijau salah ${redGreenWrong}/${redGreenTotal}, kromatik lain salah ${otherSpectrumWrong}/${otherSpectrumTotal}, lempeng kontrol plat 18 ${controlPassed ? 'valid' : 'perlu evaluasi ulang'}).`;
  }

  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const idHasil = `ISH-${randomDigits}`;
  const tanggalPemeriksaan = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return {
    idHasil,
    tanggalPemeriksaan,
    namaPeserta: namaPeserta.trim() || 'Warga Kota Baru',
    benar,
    salah,
    akurasiPersen,
    kategoriDiagnosis,
    kesimpulanMedis,
    redGreenCorrect,
    redGreenTotal,
    otherSpectrumCorrect,
    otherSpectrumTotal,
    controlPassed,
    plateDetails,
  };
}

export function IshiharaTestModal({
  isOpen,
  onClose,
  defaultName = '',
  onCompleteTest,
}: IshiharaTestModalProps) {
  const [step, setStep] = useState<'intro' | 'instructions' | 'quiz' | 'result'>('intro');
  const [namaPeserta, setNamaPeserta] = useState(defaultName);
  const [useTimer, setUseTimer] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PLATE_SECONDS);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finalResult, setFinalResult] = useState<IshiharaTestResultPayload | null>(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState(true);

  const answersRef = useRef<Record<number, string>>({});
  answersRef.current = answers;

  useEffect(() => {
    if (defaultName && !namaPeserta) {
      setNamaPeserta(defaultName);
    }
  }, [defaultName, namaPeserta]);

  const finishEvaluation = (recordedAnswers: Record<number, string>) => {
    const payload = evaluateIshiharaAnswers(namaPeserta, recordedAnswers);
    setFinalResult(payload);
    setShowCertificatePreview(true);
    setStep('result');
    onCompleteTest?.(payload);
  };

  const handleSelectOption = (chosenOption: string) => {
    const updatedAnswers = { ...answersRef.current, [currentIndex]: chosenOption };
    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);

    if (currentIndex + 1 < ISHIHARA_PLATES.length) {
      setCurrentIndex((prev) => prev + 1);
      setSecondsLeft(PLATE_SECONDS);
    } else {
      finishEvaluation(updatedAnswers);
    }
  };

  useEffect(() => {
    if (!isOpen || step !== 'quiz' || !useTimer) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.setTimeout(() => handleSelectOption('Waktu Habis'), 0);
          return PLATE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, useTimer, currentIndex]);

  const handleResetTest = () => {
    setStep('intro');
    setCurrentIndex(0);
    setSecondsLeft(PLATE_SECONDS);
    setAnswers({});
    answersRef.current = {};
    setFinalResult(null);
    setShowCertificatePreview(true);
  };

  if (!isOpen) return null;

  const currentPlate = ISHIHARA_PLATES[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / ISHIHARA_PLATES.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Tutup modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B1515] text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-extrabold text-slate-950 sm:text-lg">
                Uji Penglihatan Warna — 20 Lempeng Ishihara
              </h3>
              <p className="text-[11px] text-slate-500">
                Standar Klinis Pseudo-Isokromatik · 3 Opsi Angka &amp; 1 Opsi Tidak Ada Angka
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>

        {step === 'intro' && (
          <div className="mx-auto mt-6 max-w-md space-y-5 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Nama Lengkap Peserta Tes <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                value={namaPeserta}
                onChange={(e) => setNamaPeserta(e.target.value)}
                placeholder="Masukkan nama lengkap Anda..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setUseTimer((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-red-200"
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  Gunakan Timer Otomatis ({PLATE_SECONDS} Detik / Lempeng)
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Otomatis berpindah ke lempeng berikutnya jika waktu habis
                </p>
              </div>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  useTimer
                    ? 'border-[#8B1515] bg-[#8B1515] text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {useTimer && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>

            <button
              type="button"
              disabled={!namaPeserta.trim()}
              onClick={() => setStep('instructions')}
              className="w-full rounded-xl bg-[#8B1515] py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E] disabled:cursor-not-allowed disabled:bg-red-800/45"
            >
              Lanjut ke Instruksi Pemeriksaan →
            </button>
          </div>
        )}

        {step === 'instructions' && (
          <div className="mx-auto mt-6 max-w-xl space-y-5 py-2">
            <div className="rounded-2xl border border-red-100 bg-red-50/35 p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#8B1515]">
                <AlertCircle className="h-4 w-4" />
                <span>Persiapan &amp; Instruksi Penting Sebelum Memulai</span>
              </div>

              <ul className="mt-3 list-disc space-y-2.5 pl-5 text-xs leading-relaxed text-slate-700">
                <li>
                  <strong>Pencahayaan Sesuai:</strong> Pastikan ruangan cukup terang dan tingkat
                  kecerahan layar berada pada level optimal (70%–100%).
                </li>
                <li>
                  <strong>Jarak Layar Sekitar 50 cm:</strong> Posisikan mata Anda sejajar dengan
                  layar pada jarak kurang lebih 50 cm.
                </li>
                <li>
                  <strong>Matikan Eye Comfort / Night Shield:</strong> Wajib menonaktifkan fitur
                  filter cahaya biru agar warna lempeng Ishihara akurat.
                </li>
                <li>
                  <strong>Pilihan Ganda (3 Opsi Angka + 1 Opsi Tidak Ada Angka):</strong> Pada
                  setiap lempeng, pilih salah satu dari 3 opsi angka yang tampak pada lingkaran
                  Ishihara, atau pilih <em>Tidak Ada Angka</em>.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setSecondsLeft(PLATE_SECONDS);
                  setAnswers({});
                  answersRef.current = {};
                  setStep('quiz');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8B1515] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
              >
                <Play className="h-3.5 w-3.5" />
                Mulai Tes 20 Lempeng Ishihara Sekarang
              </button>
            </div>
          </div>
        )}

        {step === 'quiz' && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-700">
                Lempeng {currentIndex + 1} dari {ISHIHARA_PLATES.length}
              </span>
              <div className="flex items-center gap-3 font-mono font-bold">
                {useTimer && (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <Clock className="h-3.5 w-3.5" />
                    {secondsLeft} s
                  </span>
                )}
                <span className="text-red-700">{progressPercent}%</span>
              </div>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#8B1515] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-6 grid items-center gap-6 md:grid-cols-12">
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-100/80 p-5 md:col-span-6">
                <div className="flex items-center justify-center rounded-2xl bg-[#34373B] p-4 shadow-inner">
                  <IshiharaCanvasPlate plate={currentPlate} />
                </div>

                <span className="mt-4 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  {currentPlate.levelLabel}
                </span>
                <span className="mt-2 rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs">
                  {currentPlate.clinicalNote}
                </span>
              </div>

              <div className="md:col-span-6">
                <p className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-red-700">
                  SOAL KE-{currentIndex + 1} / {ISHIHARA_PLATES.length}
                </p>
                <h4 className="mt-1 font-heading text-xl font-extrabold leading-snug text-slate-950">
                  Angka berapa yang tampak pada lingkaran Ishihara ini?
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Pilih salah satu jawaban di bawah ini dengan cermat.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {currentPlate.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-xs font-extrabold text-slate-900 transition hover:border-[#8B1515] hover:bg-red-50/30"
                    >
                      <span>{opt}</span>
                      <span className="h-4 w-4 rounded-full border border-slate-200 bg-slate-100 transition group-hover:border-[#8B1515] group-hover:bg-[#8B1515]" />
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentIndex > 0) {
                        setCurrentIndex((prev) => prev - 1);
                        setSecondsLeft(PLATE_SECONDS);
                      } else {
                        setStep('instructions');
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Kembali
                  </button>
                  <span>Clinical Ishihara 20-Plate WHO</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && finalResult && (
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <div className="rounded-3xl border border-red-100 bg-red-50/30 p-6 sm:p-8">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                HASIL PEMERIKSAAN ISHIHARA —{' '}
                <strong className="text-slate-900">{finalResult.namaPeserta}</strong> ·{' '}
                <span className="font-mono text-slate-600">{finalResult.idHasil}</span>
              </p>

              <h4 className="mt-1.5 font-heading text-2xl font-extrabold text-[#8B1515]">
                Kategori Diagnosis: {finalResult.kategoriDiagnosis}
              </h4>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono text-xs font-bold">
                <span className="text-slate-700">
                  Skor Akurasi:{' '}
                  <strong className="text-slate-950">{finalResult.akurasiPersen}%</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-700">
                  Benar: {finalResult.benar}/{ISHIHARA_PLATES.length}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-red-700">
                  Salah: {finalResult.salah}/{ISHIHARA_PLATES.length}
                </span>
              </div>

              <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-slate-700">
                {finalResult.kesimpulanMedis}
              </p>

              {/* Aksi Sertifikat */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCertificatePreview((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-[#8B1515]" />
                  {showCertificatePreview ? 'Sembunyikan Sertifikat' : 'Lihat Sertifikat Hasil'}
                </button>

                <button
                  type="button"
                  onClick={() => downloadIshiharaCertificateJpeg(finalResult)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Sertifikat (JPEG)
                </button>
              </div>

              {/* Pratinjau Sertifikat */}
              {showCertificatePreview && (
                <div className="mt-5 rounded-2xl border-2 border-[#8B1515]/25 bg-[#FFFDF9] p-5 text-left shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-red-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8B1515] text-white">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B1515]">
                          Sertifikat Uji Penglihatan Warna Ishihara
                        </p>
                        <p className="font-heading text-sm font-extrabold text-slate-900">
                          RS Kota Baru — Layanan Diagnostik Visual
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-800">
                      MENUNGGU ACC STAF
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Nama Peserta
                      </span>
                      <p className="font-bold text-slate-900">{finalResult.namaPeserta}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        ID &amp; Tanggal
                      </span>
                      <p className="font-mono text-[11px] font-semibold text-slate-700">
                        {finalResult.idHasil} · {finalResult.tanggalPemeriksaan}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Diagnosis Klinis
                      </span>
                      <p className="font-extrabold text-[#8B1515]">
                        {finalResult.kategoriDiagnosis} ({finalResult.akurasiPersen}% akurasi)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rekap Per Nomor */}
              {finalResult.plateDetails && finalResult.plateDetails.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-left">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Rekap Klinis Per Nomor Lempeng (1–20)
                  </p>
                  <div className="mt-2.5 grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                    {finalResult.plateDetails.map((item) => (
                      <div
                        key={item.plateNumber}
                        className={`rounded-xl border px-3 py-2 text-[11px] ${
                          item.isCorrect
                            ? 'border-emerald-200/80 bg-emerald-50/40 text-slate-800'
                            : 'border-red-200/80 bg-red-50/50 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span>Plat #{item.plateNumber}</span>
                          <span className={item.isCorrect ? 'text-emerald-700' : 'text-[#8B1515]'}>
                            {item.isCorrect ? 'Benar' : 'Salah'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-600">
                          Jawab: <strong>{item.chosenAnswer}</strong> · Kunci:{' '}
                          <strong>{item.correctAnswer}</strong>
                        </p>
                        {!item.isCorrect && (
                          <p className="mt-0.5 text-[10px] font-semibold text-[#8B1515]">
                            → {item.indicationIfWrong}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Data hasil pemeriksaan telah tercatat dan <strong>menunggu ACC staf rumah sakit</strong>{' '}
                di Dashboard Staff. Anda tetap dapat melihat dan mengunduh draf sertifikat JPEG di
                atas untuk keperluan arsip/verifikasi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetTest}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-[#8B1515] hover:text-[#8B1515]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ulangi Tes Buta Warna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default IshiharaTestModal;