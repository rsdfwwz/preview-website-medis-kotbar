import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  MessageSquareWarning,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import type { CitizenComplaint } from '@/types';

const COMPLAINT_OPTIONS: {
  value: CitizenComplaint['jenisPengaduan'];
  desc: string;
}[] = [
  {
    value: 'Laporan / Keluhan',
    desc: 'Pengaduan insiden, pelayanan medis, atau ketidaksesuaian SOP',
  },
  {
    value: 'Kritik & Saran',
    desc: 'Masukan perbaikan sistem, alur antrean, atau fasilitas RS',
  },
  {
    value: 'Apresiasi Pelayanan',
    desc: 'Ucapan terima kasih atau pujian untuk kinerja tim paramedis',
  },
];

interface CategoryDropdownProps {
  value: CitizenComplaint['jenisPengaduan'];
  onChange: (val: CitizenComplaint['jenisPengaduan']) => void;
}

function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
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
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-sm font-medium text-slate-900 transition ${
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
          {COMPLAINT_OPTIONS.map((item) => {
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

export function ComplaintsPage() {
  const { submitComplaint } = usePortal();

  const [jenisPengaduan, setJenisPengaduan] =
    useState<CitizenComplaint['jenisPengaduan']>('Laporan / Keluhan');
  const [anonim, setAnonim] = useState(false);
  const [namaPelapor, setNamaPelapor] = useState('');
  const [subjek, setSubjek] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [buktiDataUrl, setBuktiDataUrl] = useState<string | undefined>(undefined);
  const [buktiNamaFile, setBuktiNamaFile] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Format file harus berupa JPG, PNG, GIF, atau WEBP.');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg('Ukuran lampiran bukti maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBuktiDataUrl(reader.result);
        setBuktiNamaFile(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setBuktiDataUrl(undefined);
    setBuktiNamaFile('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subjek.trim() || !kronologi.trim()) {
      setErrorMsg('Mohon lengkapi subjek dan detail kronologi pengaduan.');
      return;
    }

    const finalKronologi = buktiNamaFile
      ? `${kronologi.trim()}\n\n[Lampiran Bukti: ${buktiNamaFile}]`
      : kronologi.trim();

    const payload: Parameters<typeof submitComplaint>[0] & { buktiUrl?: string } = {
      jenisPengaduan,
      anonim,
      namaPelapor: anonim ? 'Anonim' : namaPelapor.trim() || 'Warga Kota Baru',
      subjek: subjek.trim(),
      kronologi: finalKronologi,
    };

    if (buktiDataUrl) {
      payload.buktiUrl = buktiDataUrl;
    }

    submitComplaint(payload);

    setSubmitted(true);
    setSubjek('');
    setKronologi('');
    handleRemoveFile();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-10">
          {/* Header Halaman */}
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#8B1515] ring-1 ring-red-100">
              <MessageSquareWarning className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Kotak Keluhan & Aspirasi Warga
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
              Layanan penyampaian pengaduan, kritik, dan saran untuk Rumah Sakit Kota Baru (KBRP)
              bagi seluruh warga dan pasien (dapat dikirim secara Anonim).
            </p>
          </div>

          {submitted && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">
                  Laporan / aspirasi Anda telah tercatat dan diteruskan ke Manajemen RS Kota Baru
                  (KBRP).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Baris 1: Jenis Pengaduan & Nama Pasien / Warga (Sejajar Presisi) */}
            <div className="grid items-start gap-5 sm:grid-cols-2">
              <div>
                <div className="flex min-h-[20px] items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Jenis Pengaduan <span className="text-red-700">*</span>
                  </label>
                </div>
                <CategoryDropdown value={jenisPengaduan} onChange={setJenisPengaduan} />
              </div>

              <div>
                <div className="flex min-h-[20px] items-center justify-between gap-2">
                  <label className="truncate text-xs font-bold text-slate-800">
                    Nama Pasien / Warga{' '}
                    <span className="font-medium text-slate-400">(Opsional)</span>
                  </label>
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-bold text-[#8B1515]">
                    <input
                      type="checkbox"
                      checked={anonim}
                      onChange={(e) => setAnonim(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-[#8B1515]"
                    />
                    <span>Anonim</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={anonim}
                  value={anonim ? '' : namaPelapor}
                  onChange={(e) => setNamaPelapor(e.target.value)}
                  placeholder={anonim ? 'Identitas disembunyikan' : 'Kosongkan jika ingin anonim'}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#8B1515] focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* Baris 2: Subjek / Topik */}
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Subjek / Topik <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                required
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                placeholder="Ringkasan topik laporan atau saran Anda"
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Baris 3: Detail Kronologi / Isi Keluhan */}
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Detail Kronologi / Isi Keluhan <span className="text-red-700">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={kronologi}
                onChange={(e) => setKronologi(e.target.value)}
                placeholder="Tuliskan detail kronologi, waktu kejadian, lokasi, serta pihak terkait..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Baris 4: Lampiran Bukti */}
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Lampiran Bukti (JPG / PNG / GIF — Maks. 5 MB)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!buktiDataUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 text-left text-xs text-slate-500 transition hover:border-[#8B1515] hover:bg-red-50/30 hover:text-[#8B1515]"
                >
                  <span>Klik untuk melampirkan gambar pendukung (Opsional)</span>
                  <ImagePlus className="h-4 w-4 shrink-0 text-[#8B1515]" />
                </button>
              ) : (
                <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={buktiDataUrl}
                      alt="Preview bukti"
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{buktiNamaFile}</p>
                      <p className="text-[11px] text-emerald-700">Siap dilampirkan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* Info Privasi Singkat */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#8B1515]" />
              <span>
                Setiap laporan diproses secara rahasia oleh jajaran Manajemen & HRD RS Kota Baru
                (KBRP).
              </span>
            </div>

            {/* Tombol Kirim */}
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-5 text-sm font-bold text-white shadow-md shadow-red-900/15 transition hover:bg-[#6D0E0E]"
            >
              <Send className="h-4 w-4" />
              Kirim Laporan Pengaduan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export const ComplaintPage = ComplaintsPage;
export default ComplaintsPage;