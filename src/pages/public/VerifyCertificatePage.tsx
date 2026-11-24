import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  QrCode,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  TEST_RESULTS_STORAGE_KEY,
  type StoredTestResultRecord,
} from './TestResultsPage';

export interface VerifiedDocumentRecord {
  nomorDokumen: string;
  kategoriDokumen:
    | 'Surat Keterangan Sehat (SKS)'
    | 'Sertifikat Tes Psikologi'
    | 'Sertifikat Tes Buta Warna'
    | 'Dokumen Medis Resmi';
  statusLabel: 'SAH / VALID' | 'KEDALUWARSA / TIDAK AKTIF';
  namaPenerima: string;
  citizenId: string;
  hasilPemeriksaan: string;
  catatanMedis: string;
  penandatanganNama: string;
  penandatanganJabatan: string;
  tanggalTerbitDanBerlaku: string;
  badgeTag: string;
}

const BUILTIN_DOCUMENTS: VerifiedDocumentRecord[] = [
  {
    nomorDokumen: 'SKS-KBR-2026-0891',
    kategoriDokumen: 'Surat Keterangan Sehat (SKS)',
    statusLabel: 'SAH / VALID',
    namaPenerima: 'Bima Baskara',
    citizenId: 'KBR-88210',
    hasilPemeriksaan: 'DINYATAKAN SEHAT JASMANI & ROHANI (TD: 120/80 mmHg, Penglihatan Normal)',
    catatanMedis: 'Memenuhi syarat kesehatan untuk melamar pekerjaan instansi & pembuatan lisensi.',
    penandatanganNama: 'Dr. Louis Benedict, Sp.B',
    penandatanganJabatan: 'Director · NIP KBR-MED-001',
    tanggalTerbitDanBerlaku: '2026-11-20 s/d 2026-12-20',
    badgeTag: 'Terverifikasi Server RS-KBR',
  },
  {
    nomorDokumen: 'SKS-KBR-2026-0744',
    kategoriDokumen: 'Surat Keterangan Sehat (SKS)',
    statusLabel: 'SAH / VALID',
    namaPenerima: 'Araki Ise',
    citizenId: 'KBR-55109',
    hasilPemeriksaan: 'DINYATAKAN SEHAT JASMANI & ROHANI (TD: 118/76 mmHg, Penglihatan Normal)',
    catatanMedis: 'Diterbitkan untuk keperluan administrasi warga & kelengkapan berkas instansi.',
    penandatanganNama: 'dr. Levi Vance Harrington, S.Ked',
    penandatanganJabatan: 'Chief of Medical · NIP KBR-MED-004',
    tanggalTerbitDanBerlaku: '2026-11-18 s/d 2026-12-02',
    badgeTag: 'Terverifikasi Server RS-KBR',
  },
];

function collectIssuedDocuments(): VerifiedDocumentRecord[] {
  const docs: VerifiedDocumentRecord[] = [...BUILTIN_DOCUMENTS];

  try {
    const rawTests = localStorage.getItem(TEST_RESULTS_STORAGE_KEY);
    if (rawTests) {
      const parsedTests = JSON.parse(rawTests);
      if (Array.isArray(parsedTests)) {
        for (const item of parsedTests as StoredTestResultRecord[]) {
          if (!item?.certificateNumber && !item?.id) continue;
          const certNo = String(item.certificateNumber || item.id).trim().toUpperCase();
          const isPsych = item.category === 'psikologi';

          docs.push({
            nomorDokumen: certNo,
            kategoriDokumen: isPsych
              ? 'Sertifikat Tes Psikologi'
              : 'Sertifikat Tes Buta Warna',
            statusLabel: 'SAH / VALID',
            namaPenerima: item.namaPeserta || 'Peserta Terdaftar',
            citizenId: item.citizenId || 'KBR-VERIFIED',
            hasilPemeriksaan: item.skorRingkas || item.interpretasi,
            catatanMedis: isPsych
              ? `Interpretasi Psikologis: ${item.interpretasi}${item.tujuanEvaluasi ? ` — Tujuan: ${item.tujuanEvaluasi}` : ''}.`
              : `Diagnosis Penglihatan Warna: ${item.interpretasi}${item.tujuanEvaluasi ? ` — ${item.tujuanEvaluasi}` : ''}.`,
            penandatanganNama: 'dr. Levi Vance Harrington, S.Ked',
            penandatanganJabatan: 'Unit Layanan Medis & Psikologi · RS-KBR',
            tanggalTerbitDanBerlaku: `${item.tanggalTes || '2026-11-24'} · Berlaku Resmi`,
            badgeTag: `${certNo} · Terverifikasi RS-KBR`,
          });
        }
      }
    }
  } catch {
    // Abaikan error parse
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.toLowerCase().includes('submission')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      for (const row of parsed) {
        const nomor = String(row?.kodeTiket || row?.noSurat || row?.ticket || '')
          .trim()
          .toUpperCase();
        if (!nomor) continue;
        const alreadyExists = docs.some((d) => d.nomorDokumen.toUpperCase() === nomor);
        if (alreadyExists) continue;

        const statusStr = String(row?.status || row?.statusLabel || 'Terdaftar');
        const isCancelled = statusStr.toLowerCase().includes('batal');

        docs.push({
          nomorDokumen: nomor,
          kategoriDokumen: 'Dokumen Medis Resmi',
          statusLabel: isCancelled ? 'KEDALUWARSA / TIDAK AKTIF' : 'SAH / VALID',
          namaPenerima: String(row?.namaWarga || row?.namaPeserta || 'Warga Kota Baru'),
          citizenId: String(row?.citizenId || 'KBR-00000'),
          hasilPemeriksaan: `${String(row?.jenisLayanan || 'Layanan Medis')} — Status: ${statusStr}`,
          catatanMedis: String(
            row?.detailPermintaan || 'Tercatat dalam sistem administrasi RS Kota Baru.'
          ),
          penandatanganNama: 'Tim Administrasi Medis RS-KBR',
          penandatanganJabatan: 'Pillbox Medical Center · Koord. 201',
          tanggalTerbitDanBerlaku: String(
            row?.tanggalPengajuan || row?.createdAt || '2026-11-24'
          ),
          badgeTag: `${nomor} · Sistem RS-KBR`,
        });
      }
    }
  } catch {
    // Abaikan error parse
  }

  return docs;
}

function normalizeDocCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/^#/, '')
    .replace(/\s+/g, '');
}

export function VerifyCertificatePage() {
  const { noSurat } = useParams<{ noSurat?: string }>();
  const navigate = useNavigate();

  const paramCode = useMemo(() => {
    if (noSurat && decodeURIComponent(noSurat).trim()) {
      return decodeURIComponent(noSurat).trim().toUpperCase();
    }
    return '';
  }, [noSurat]);

  const [inputValue, setInputValue] = useState<string>(paramCode);
  const [searchedCode, setSearchedCode] = useState<string>(paramCode);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(paramCode));
  const [allDocs, setAllDocs] = useState<VerifiedDocumentRecord[]>(() =>
    collectIssuedDocuments()
  );

  useEffect(() => {
    const syncDocs = () => {
      setAllDocs(collectIssuedDocuments());
    };
    window.addEventListener('rskbr:test-results-updated', syncDocs);
    window.addEventListener('rskbr:submissions-updated', syncDocs);
    window.addEventListener('storage', syncDocs);
    return () => {
      window.removeEventListener('rskbr:test-results-updated', syncDocs);
      window.removeEventListener('rskbr:submissions-updated', syncDocs);
      window.removeEventListener('storage', syncDocs);
    };
  }, []);

  useEffect(() => {
    if (paramCode) {
      setInputValue(paramCode);
      setSearchedCode(paramCode);
      setHasSearched(true);
    } else {
      setInputValue('');
      setSearchedCode('');
      setHasSearched(false);
    }
  }, [paramCode]);

  const matchedDocument = useMemo(() => {
    if (!hasSearched) return null;
    const target = normalizeDocCode(searchedCode);
    if (!target) return null;

    const exact = allDocs.find(
      (d) => normalizeDocCode(d.nomorDokumen) === target
    );
    if (exact) return exact;

    return (
      allDocs.find((d) => normalizeDocCode(d.nomorDokumen).includes(target)) ?? null
    );
  }, [allDocs, searchedCode, hasSearched]);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputValue.trim().toUpperCase();
    setHasSearched(true);
    setSearchedCode(cleaned);
    if (cleaned) {
      navigate(`/verify/${encodeURIComponent(cleaned)}`, { replace: true });
    } else {
      navigate('/verify', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10">
          {/* Header Tengah */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-[#8B1515]">
              <FileCheck2 className="h-6 w-6" />
            </div>

            <h1 className="mt-4 font-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Verifikasi Keaslian Dokumen &amp; Sertifikat
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
              Sistem pengecekan resmi bagi Kepolisian (LSPD), Pemerintahan, dan Warga Kota Baru
              untuk memverifikasi nomor terbitan surat maupun sertifikat medis.
            </p>
          </div>

          {/* Form Pencarian Nomor Surat / Sertifikat */}
          <form
            onSubmit={handleVerifySubmit}
            className="mx-auto mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Masukkan nomor surat atau sertifikat (contoh: SKS-KBR-2026-0891 / CERT-PSI-...)"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 font-mono text-xs font-semibold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#6D0E0E] sm:text-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Cek Dokumen</span>
            </button>
          </form>

          {/* Hasil Verifikasi Hanya Muncul Setelah Klik Cek Dokumen atau Buka /verify/:noSurat */}
          {hasSearched && (
            <div className="mx-auto mt-8 max-w-2xl">
              {matchedDocument ? (
                <div
                  className={`rounded-2xl border p-6 ${
                    matchedDocument.statusLabel === 'SAH / VALID'
                      ? 'border-emerald-200 bg-emerald-50/45'
                      : 'border-amber-200 bg-amber-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-200/60 pb-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className={`mt-0.5 h-5 w-5 shrink-0 ${
                          matchedDocument.statusLabel === 'SAH / VALID'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      />
                      <div>
                        <p
                          className={`text-[11px] font-extrabold uppercase tracking-wider ${
                            matchedDocument.statusLabel === 'SAH / VALID'
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                          }`}
                        >
                          STATUS DOKUMEN: {matchedDocument.statusLabel}
                        </p>
                        <h2 className="mt-0.5 font-heading text-lg font-extrabold text-slate-950 sm:text-xl">
                          {matchedDocument.kategoriDokumen}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-white px-3.5 py-2 shadow-2xs">
                      <QrCode className="h-5 w-5 shrink-0 text-slate-800" />
                      <div className="text-left leading-tight">
                        <p className="font-mono text-[11px] font-extrabold text-slate-900">
                          {matchedDocument.nomorDokumen}
                        </p>
                        <p className="text-[10px] font-medium text-emerald-700">
                          {matchedDocument.badgeTag}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Nama Penerima (IC)</p>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                        {matchedDocument.namaPenerima}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Citizen ID</p>
                      <p className="mt-0.5 font-mono text-sm font-extrabold text-slate-950">
                        {matchedDocument.citizenId}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-medium text-slate-500">
                      Hasil Pemeriksaan / Penilaian
                    </p>
                    <p className="mt-1 font-mono text-xs font-extrabold text-emerald-700 sm:text-sm">
                      {matchedDocument.hasilPemeriksaan}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-medium text-slate-500">Catatan Medis</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-700 sm:text-sm">
                      {matchedDocument.catatanMedis}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-emerald-200/60 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Ditandatangani Oleh (Dokter / Pejabat RS)
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-[#8B1515]">
                        {matchedDocument.penandatanganNama}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {matchedDocument.penandatanganJabatan}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Tanggal Terbit &amp; Masa Berlaku
                      </p>
                      <p className="mt-0.5 font-mono text-xs font-extrabold text-slate-900 sm:text-sm">
                        {matchedDocument.tanggalTerbitDanBerlaku}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center">
                  <AlertCircle className="mx-auto h-7 w-7 text-[#8B1515]" />
                  <h2 className="mt-2 font-heading text-base font-extrabold text-[#8B1515]">
                    {searchedCode
                      ? 'Nomor Surat atau Sertifikat Tidak Ditemukan'
                      : 'Masukkan Nomor Surat atau Sertifikat'}
                  </h2>
                  <p className="mt-1 text-xs text-red-900/80">
                    {searchedCode ? (
                      <>
                        Tidak ada surat maupun sertifikat yang cocok dengan nomor{' '}
                        <span className="rounded bg-white px-2 py-0.5 font-mono font-bold text-slate-900">
                          {searchedCode}
                        </span>
                        . Periksa kembali penulisan nomor yang tertera pada dokumen.
                      </>
                    ) : (
                      'Ketik nomor surat atau sertifikat pada kolom di atas lalu klik Cek Dokumen.'
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyCertificatePage;