import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';

export interface PsychologyEvaluationPayload {
  namaPeserta: string;
  tanggalLahir: string;
  umur: string;
  gender: string;
  pekerjaan: string;
  citizenId: string;
  noHpIc: string;
  tujuanPemeriksaan: string;
  keluhanSingkat: string;
  ghqScore: number;
  ghqKategori: string;
  dassStresScore: number;
  dassStresKategori: string;
  dassKecemasanScore: number;
  dassKecemasanKategori: string;
  dassDepresiScore: number;
  dassDepresiKategori: string;
  summaryText: string;
}

interface PsychologyEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultCitizenId?: string;
  defaultPhone?: string;
  defaultPurpose?: string;
  onCompleteEvaluation: (payload: PsychologyEvaluationPayload) => void;
}

interface GhqQuestionItem {
  id: number;
  type: 'POSITIF' | 'NEGATIF';
  prompt: string;
}

type DassSubscale = 'Stres' | 'Kecemasan' | 'Depresi';

interface DassQuestionItem {
  id: number;
  subscale: DassSubscale;
  prompt: string;
}

const GHQ_OPTIONS = [
  { value: 0, code: 'A', label: 'A: Sama sekali tidak' },
  { value: 1, code: 'B', label: 'B: Tidak lebih dari biasanya' },
  { value: 2, code: 'C', label: 'C: Lebih dari biasanya' },
  { value: 3, code: 'D', label: 'D: Jauh lebih dari biasanya' },
];

const DASS_OPTIONS = [
  { value: 0, label: '0: Tidak pernah' },
  { value: 1, label: '1: Kadang-kadang' },
  { value: 2, label: '2: Sering' },
  { value: 3, label: '3: Sangat sering' },
];

const TUJUAN_PEMERIKSAAN_OPTIONS = [
  'Rekrutmen Kepolisian / Instansi',
  'Pengajuan Lisensi Senjata / Khusus',
  'Evaluasi Kesehatan Mental Mandiri',
  'Konsultasi & Evaluasi Mandiri',
];

const GHQ_12_QUESTIONS: GhqQuestionItem[] = [
  {
    id: 1,
    type: 'POSITIF',
    prompt: 'Apakah Anda mampu berkonsentrasi pada apa pun yang sedang Anda lakukan?',
  },
  {
    id: 2,
    type: 'NEGATIF',
    prompt: 'Apakah Anda kehilangan waktu tidur karena khawatir?',
  },
  {
    id: 3,
    type: 'POSITIF',
    prompt: 'Apakah Anda merasa memainkan peran yang bermanfaat dalam berbagai hal?',
  },
  {
    id: 4,
    type: 'POSITIF',
    prompt: 'Apakah Anda merasa mampu mengambil keputusan tentang berbagai hal?',
  },
  {
    id: 5,
    type: 'NEGATIF',
    prompt: 'Apakah Anda merasa terus-menerus berada di bawah tekanan?',
  },
  {
    id: 6,
    type: 'NEGATIF',
    prompt: 'Apakah Anda merasa tidak dapat mengatasi kesulitan Anda?',
  },
  {
    id: 7,
    type: 'POSITIF',
    prompt: 'Apakah Anda mampu menikmati aktivitas sehari-hari secara wajar?',
  },
  {
    id: 8,
    type: 'POSITIF',
    prompt: 'Apakah Anda mampu menghadapi masalah-masalah Anda secara memadai?',
  },
  {
    id: 9,
    type: 'NEGATIF',
    prompt: 'Apakah Anda merasa kurang bahagia dan tertekan?',
  },
  {
    id: 10,
    type: 'NEGATIF',
    prompt: 'Apakah Anda kehilangan rasa percaya diri pada diri sendiri?',
  },
  {
    id: 11,
    type: 'NEGATIF',
    prompt: 'Apakah Anda menganggap diri Anda sebagai orang yang tidak berharga?',
  },
  {
    id: 12,
    type: 'POSITIF',
    prompt: 'Apakah Anda merasa relatif bahagia, secara umum?',
  },
];

const DASS_21_QUESTIONS: DassQuestionItem[] = [
  { id: 1, subscale: 'Stres', prompt: 'Saya merasa sulit untuk menenangkan diri.' },
  { id: 2, subscale: 'Kecemasan', prompt: 'Saya menyadari mulut saya terasa kering.' },
  { id: 3, subscale: 'Depresi', prompt: 'Saya sama sekali tidak dapat merasakan perasaan positif.' },
  {
    id: 4,
    subscale: 'Kecemasan',
    prompt:
      'Saya mengalami kesulitan bernapas (misalnya napas cepat atau terengah-engah tanpa aktivitas fisik).',
  },
  { id: 5, subscale: 'Depresi', prompt: 'Saya merasa sulit untuk berinisiatif melakukan sesuatu.' },
  { id: 6, subscale: 'Stres', prompt: 'Saya cenderung bereaksi berlebihan terhadap suatu situasi.' },
  { id: 7, subscale: 'Kecemasan', prompt: 'Saya mengalami gemetar (misalnya pada tangan).' },
  { id: 8, subscale: 'Stres', prompt: 'Saya merasa telah menghabiskan banyak energi karena cemas.' },
  {
    id: 9,
    subscale: 'Kecemasan',
    prompt:
      'Saya khawatir akan situasi di mana saya mungkin panik dan mempermalukan diri sendiri.',
  },
  { id: 10, subscale: 'Depresi', prompt: 'Saya merasa tidak ada hal yang dapat saya harapkan.' },
  { id: 11, subscale: 'Stres', prompt: 'Saya merasa mudah gelisah.' },
  { id: 12, subscale: 'Stres', prompt: 'Saya merasa sulit untuk bersantai.' },
  { id: 13, subscale: 'Depresi', prompt: 'Saya merasa sedih dan tertekan.' },
  {
    id: 14,
    subscale: 'Stres',
    prompt:
      'Saya tidak dapat memaklumi hal apa pun yang menghalangi saya menyelesaikan hal yang sedang saya lakukan.',
  },
  { id: 15, subscale: 'Kecemasan', prompt: 'Saya merasa hampir panik.' },
  { id: 16, subscale: 'Depresi', prompt: 'Saya tidak mampu merasa antusias terhadap banyak hal.' },
  {
    id: 17,
    subscale: 'Depresi',
    prompt: 'Saya merasa diri saya tidak berharga sebagai seorang manusia.',
  },
  { id: 18, subscale: 'Stres', prompt: 'Saya merasa bahwa saya cukup mudah tersinggung.' },
  {
    id: 19,
    subscale: 'Kecemasan',
    prompt:
      'Saya menyadari kondisi jantung saya tanpa aktivitas fisik (misalnya jantung berdebar atau detak meloncat).',
  },
  { id: 20, subscale: 'Kecemasan', prompt: 'Saya merasa takut tanpa alasan yang jelas.' },
  { id: 21, subscale: 'Depresi', prompt: 'Saya merasa hidup ini tidak berarti.' },
];

function classifyGhqScore(score: number): string {
  if (score <= 12) return 'Normal / Sehat Mental';
  if (score <= 20) return 'Distres Ringan';
  return 'Perlu Evaluasi Lanjutan';
}

function classifyDassSubscale(subscale: DassSubscale, rawSum: number): string {
  const scaled = rawSum * 2;
  if (subscale === 'Depresi') {
    if (scaled <= 9) return 'Normal';
    if (scaled <= 13) return 'Ringan';
    if (scaled <= 20) return 'Sedang';
    if (scaled <= 27) return 'Parah';
    return 'Sangat Parah';
  }
  if (subscale === 'Kecemasan') {
    if (scaled <= 7) return 'Normal';
    if (scaled <= 9) return 'Ringan';
    if (scaled <= 14) return 'Sedang';
    if (scaled <= 19) return 'Parah';
    return 'Sangat Parah';
  }
  if (scaled <= 14) return 'Normal';
  if (scaled <= 18) return 'Ringan';
  if (scaled <= 25) return 'Sedang';
  if (scaled <= 33) return 'Parah';
  return 'Sangat Parah';
}

export function PsychologyEvaluationModal({
  isOpen,
  onClose,
  defaultName = '',
  defaultCitizenId = '',
  defaultPhone = '',
  defaultPurpose = '',
  onCompleteEvaluation,
}: PsychologyEvaluationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [namaPeserta, setNamaPeserta] = useState(defaultName);
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [umur, setUmur] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [pekerjaan, setPekerjaan] = useState('');
  const [citizenId, setCitizenId] = useState(defaultCitizenId);
  const [noHpIc, setNoHpIc] = useState(defaultPhone);
  const [tujuanPemeriksaan, setTujuanPemeriksaan] = useState(
    defaultPurpose && TUJUAN_PEMERIKSAAN_OPTIONS.includes(defaultPurpose)
      ? defaultPurpose
      : TUJUAN_PEMERIKSAAN_OPTIONS[0]
  );
  const [keluhanSingkat, setKeluhanSingkat] = useState('');

  const [ghqAnswers, setGhqAnswers] = useState<Record<number, number>>({});
  const [dassAnswers, setDassAnswers] = useState<Record<number, number>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setNamaPeserta(defaultName);
    setCitizenId(defaultCitizenId);
    setNoHpIc(defaultPhone);
    if (defaultPurpose && TUJUAN_PEMERIKSAAN_OPTIONS.includes(defaultPurpose)) {
      setTujuanPemeriksaan(defaultPurpose);
    }
    setGhqAnswers({});
    setDassAnswers({});
    setValidationError(null);
  }, [isOpen, defaultName, defaultCitizenId, defaultPhone, defaultPurpose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const isStep1Complete = useMemo(() => {
    return Boolean(
      namaPeserta.trim() &&
        tanggalLahir.trim() &&
        umur.trim() &&
        pekerjaan.trim() &&
        citizenId.trim() &&
        noHpIc.trim()
    );
  }, [namaPeserta, tanggalLahir, umur, pekerjaan, citizenId, noHpIc]);

  const ghqAnsweredCount = useMemo(
    () => GHQ_12_QUESTIONS.filter((q) => typeof ghqAnswers[q.id] === 'number').length,
    [ghqAnswers]
  );

  const dassAnsweredCount = useMemo(
    () => DASS_21_QUESTIONS.filter((q) => typeof dassAnswers[q.id] === 'number').length,
    [dassAnswers]
  );

  if (!isOpen) return null;

  const validateStep1 = (): boolean => {
    setValidationError(null);
    if (!namaPeserta.trim()) {
      setValidationError('Lengkapi Nama Lengkap peserta terlebih dahulu sebelum mulai tes.');
      return false;
    }
    if (!tanggalLahir.trim()) {
      setValidationError('Lengkapi Tanggal Lahir peserta terlebih dahulu sebelum mulai tes.');
      return false;
    }
    if (!umur.trim()) {
      setValidationError('Lengkapi Umur peserta terlebih dahulu sebelum mulai tes.');
      return false;
    }
    if (!pekerjaan.trim()) {
      setValidationError('Lengkapi Pekerjaan peserta terlebih dahulu sebelum mulai tes.');
      return false;
    }
    if (!citizenId.trim()) {
      setValidationError('Lengkapi Citizen ID peserta terlebih dahulu sebelum mulai tes.');
      return false;
    }
    if (!noHpIc.trim()) {
      setValidationError('Lengkapi No HP / IC peserta terlebih dahulu sebelum mulai tes.');
      return false;
    }
    return true;
  };

  const handleGoToStep2 = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleFinishTest = () => {
    setValidationError(null);
    if (!isStep1Complete) {
      setStep(1);
      validateStep1();
      return;
    }
    if (ghqAnsweredCount < GHQ_12_QUESTIONS.length) {
      setValidationError(
        `Selesaikan seluruh soal Bagian 1 (GHQ-12: ${ghqAnsweredCount}/${GHQ_12_QUESTIONS.length} terjawab).`
      );
      return;
    }
    if (dassAnsweredCount < DASS_21_QUESTIONS.length) {
      setValidationError(
        `Selesaikan seluruh soal Bagian 2 (DASS-21: ${dassAnsweredCount}/${DASS_21_QUESTIONS.length} terjawab).`
      );
      return;
    }

    const ghqScore = GHQ_12_QUESTIONS.reduce((acc, q) => acc + (ghqAnswers[q.id] ?? 0), 0);
    const ghqKategori = classifyGhqScore(ghqScore);

    const sumBySubscale = (sub: DassSubscale) =>
      DASS_21_QUESTIONS.filter((q) => q.subscale === sub).reduce(
        (acc, q) => acc + (dassAnswers[q.id] ?? 0),
        0
      );

    const stresRaw = sumBySubscale('Stres');
    const cemasRaw = sumBySubscale('Kecemasan');
    const depresiRaw = sumBySubscale('Depresi');

    const dassStresScore = stresRaw * 2;
    const dassKecemasanScore = cemasRaw * 2;
    const dassDepresiScore = depresiRaw * 2;

    const dassStresKategori = classifyDassSubscale('Stres', stresRaw);
    const dassKecemasanKategori = classifyDassSubscale('Kecemasan', cemasRaw);
    const dassDepresiKategori = classifyDassSubscale('Depresi', depresiRaw);

    const summaryText = `Tujuan: ${tujuanPemeriksaan.trim()} | Umur: ${umur.trim()} Thn | Gender: ${gender} | Pekerjaan: ${pekerjaan.trim()} | GHQ-12: ${ghqScore}/36 (${ghqKategori}) | DASS-21: Stres ${dassStresScore} (${dassStresKategori}), Cemas ${dassKecemasanScore} (${dassKecemasanKategori}), Depresi ${dassDepresiScore} (${dassDepresiKategori})${keluhanSingkat.trim() ? ` | Keluhan: ${keluhanSingkat.trim()}` : ''}`;

    onCompleteEvaluation({
      namaPeserta: namaPeserta.trim(),
      tanggalLahir: tanggalLahir.trim(),
      umur: umur.trim(),
      gender,
      pekerjaan: pekerjaan.trim(),
      citizenId: citizenId.trim().toUpperCase(),
      noHpIc: noHpIc.trim(),
      tujuanPemeriksaan: tujuanPemeriksaan.trim(),
      keluhanSingkat: keluhanSingkat.trim(),
      ghqScore,
      ghqKategori,
      dassStresScore,
      dassStresKategori,
      dassKecemasanScore,
      dassKecemasanKategori,
      dassDepresiScore,
      dassDepresiKategori,
      summaryText,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 sm:p-5 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#8B1515] text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-extrabold text-slate-950 sm:text-lg">
                Tes &amp; Evaluasi Psikologi
              </h2>
              <p className="text-[11px] text-slate-500">
                Alur: 1. Isi Data Diri → 2. Kerjakan Tes GHQ-12 &amp; DASS-21 → 3. Kirim Pengajuan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setStep(1);
              }}
              className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                step === 1
                  ? 'bg-[#8B1515] text-white shadow-2xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              1. Data Diri
            </button>

            <button
              type="button"
              onClick={() => handleGoToStep2()}
              title={
                isStep1Complete
                  ? 'Lanjut ke soal tes psikologi'
                  : 'Lengkapi data diri terlebih dahulu'
              }
              className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                step === 2
                  ? 'bg-[#8B1515] text-white shadow-2xs'
                  : isStep1Complete
                    ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              {!isStep1Complete && <Lock className="h-3 w-3" />}
              <span>2. Tes Psikologi</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
              aria-label="Tutup modal tes psikologi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {validationError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[#8B1515]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {step === 1 ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-[11px]">
                <span className="font-extrabold uppercase tracking-wider text-[#8B1515]">
                  LANGKAH 1 DARI 2 — DATA DIRI PESERTA
                </span>
                <span className="text-slate-400">
                  Wajib diisi lengkap sebelum membuka soal tes
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Nama Lengkap <span className="text-[#8B1515]">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaPeserta}
                    onChange={(e) => setNamaPeserta(e.target.value)}
                    placeholder="Nama lengkap peserta sesuai identitas IC"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Tanggal Lahir <span className="text-[#8B1515]">*</span>
                    </label>
                    <input
                      type="date"
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Umur (Tahun) <span className="text-[#8B1515]">*</span>
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={100}
                      value={umur}
                      onChange={(e) => setUmur(e.target.value)}
                      placeholder="Contoh: 24"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Gender <span className="text-[#8B1515]">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Citizen ID <span className="text-[#8B1515]">*</span>
                    </label>
                    <input
                      type="text"
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value)}
                      placeholder="Contoh: KBR-88210"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Pekerjaan <span className="text-[#8B1515]">*</span>
                    </label>
                    <input
                      type="text"
                      value={pekerjaan}
                      onChange={(e) => setPekerjaan(e.target.value)}
                      placeholder="Pekerjaan saat ini"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      No HP / IC <span className="text-[#8B1515]">*</span>
                    </label>
                    <input
                      type="text"
                      value={noHpIc}
                      onChange={(e) => setNoHpIc(e.target.value)}
                      placeholder="Nomor kontak aktif"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Tujuan Pemeriksaan <span className="text-[#8B1515]">*</span>
                    </label>
                    <select
                      value={tujuanPemeriksaan}
                      onChange={(e) => setTujuanPemeriksaan(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                    >
                      {TUJUAN_PEMERIKSAAN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Keluhan / Riwayat Psikologis Singkat
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <Lock className="h-3 w-3" />
                      Opsional &amp; Kerahasiaan Terjamin
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={keluhanSingkat}
                    onChange={(e) => setKeluhanSingkat(e.target.value)}
                    placeholder="Jelaskan secara singkat keluhan, kendala emosional, atau latar belakang pengajuan tes psikologi Anda."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#8B1515] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8B1515]">
                    LANGKAH 2 DARI 2 — TES PSIKOLOGI (GHQ-12 &amp; DASS-21)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Peserta: <strong className="text-slate-900">{namaPeserta}</strong> (
                    <span className="font-mono">{citizenId.toUpperCase()}</span>) · Selesaikan
                    seluruh soal sebelum kembali ke form kirim.
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] font-bold">
                  <span
                    className={`rounded-lg border px-2.5 py-1 ${
                      ghqAnsweredCount === GHQ_12_QUESTIONS.length
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-[#8B1515]'
                    }`}
                  >
                    GHQ-12: {ghqAnsweredCount}/{GHQ_12_QUESTIONS.length}
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-1 ${
                      dassAnsweredCount === DASS_21_QUESTIONS.length
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-sky-200 bg-sky-50 text-sky-700'
                    }`}
                  >
                    DASS-21: {dassAnsweredCount}/{DASS_21_QUESTIONS.length}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-white">
                <h3 className="font-heading text-sm font-extrabold sm:text-base">
                  Bagian 1: Skrining Kesehatan Mental Umum (GHQ-12)
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Pilih jawaban berdasarkan kondisi yang Anda rasakan selama 2 minggu terakhir.
                </p>
                <div className="mt-3 grid gap-2 border-t border-slate-700/80 pt-3 text-[11px] text-slate-200 sm:grid-cols-2">
                  <span>• A: Sama sekali tidak</span>
                  <span>• B: Tidak lebih dari biasanya</span>
                  <span>• C: Lebih dari biasanya</span>
                  <span>• D: Jauh lebih dari biasanya</span>
                </div>
              </div>

              <div className="space-y-4">
                {GHQ_12_QUESTIONS.map((q) => {
                  const currentVal = ghqAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                    >
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8B1515]">
                        GHQ-12 · SOAL #{q.id} (ITEM {q.type})
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {q.id}. {q.prompt}
                      </p>

                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {GHQ_OPTIONS.map((opt) => {
                          const selected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.code}
                              type="button"
                              onClick={() =>
                                setGhqAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                              }
                              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                                selected
                                  ? 'border-[#8B1515] bg-red-50/70 font-bold text-[#8B1515]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                                  selected ? 'border-[#8B1515]' : 'border-slate-300'
                                }`}
                              >
                                {selected && (
                                  <span className="h-2 w-2 rounded-full bg-[#8B1515]" />
                                )}
                              </span>
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-white">
                <h3 className="font-heading text-sm font-extrabold sm:text-base">
                  Bagian 2: Skala Depresi, Kecemasan, dan Stres (DASS-21)
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Berikan penilaian seberapa sering pernyataan berikut berlaku untuk Anda selama
                  seminggu terakhir.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-700/80 pt-3 text-[11px] text-slate-200 sm:grid-cols-4">
                  <span>• 0: Tidak pernah</span>
                  <span>• 1: Kadang-kadang</span>
                  <span>• 2: Sering</span>
                  <span>• 3: Sangat sering</span>
                </div>
              </div>

              <div className="space-y-4">
                {DASS_21_QUESTIONS.map((q) => {
                  const currentVal = dassAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                    >
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-700">
                        DASS-21 · SOAL #{q.id} ({q.subscale.toUpperCase()})
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {q.id}. {q.prompt}{' '}
                        <span className="font-normal italic text-slate-500">({q.subscale})</span>
                      </p>

                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {DASS_OPTIONS.map((opt) => {
                          const selected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setDassAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                              }
                              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                                selected
                                  ? 'border-[#8B1515] bg-red-50/70 font-bold text-[#8B1515]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                                  selected ? 'border-[#8B1515]' : 'border-slate-300'
                                }`}
                              >
                                {selected && (
                                  <span className="h-2 w-2 rounded-full bg-[#8B1515]" />
                                )}
                              </span>
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleGoToStep2}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8B1515] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
              >
                <span>Lanjut ke Tes Psikologi</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setStep(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Data Diri</span>
              </button>

              <button
                type="button"
                onClick={handleFinishTest}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8B1515] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Selesai &amp; Simpan Hasil Tes</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PsychologyEvaluationModal;