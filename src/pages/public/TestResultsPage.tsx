import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Brain,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { IshiharaTestResultPayload } from '@/components/IshiharaTestModal';
import type { PsychologyEvaluationPayload } from '@/components/PsychologyEvaluationModal';

export type TestCategoryType = 'psikologi' | 'buta_warna';
export type TestApprovalStatusType = 'Menunggu ACC Staf' | 'Disetujui Staf';

export interface StoredTestResultRecord {
  id: string;
  certificateNumber?: string;
  approvalStatus: TestApprovalStatusType;
  reviewedByStaff?: string;
  reviewedAt?: string;
  category: TestCategoryType;
  namaPeserta: string;
  tanggalLahir?: string;
  umur?: string;
  gender?: string;
  citizenId?: string;
  pekerjaan?: string;
  noHpIc?: string;
  tujuanEvaluasi: string;
  keluhanSingkat?: string;
  tanggalTes: string;
  skorRingkas: string;
  interpretasi: string;
  status: 'Completed';
  psychDetail?: PsychologyEvaluationPayload;
  ishiharaDetail?: IshiharaTestResultPayload;
}

export const TEST_RESULTS_STORAGE_KEY = 'rskbr_test_results_v1';

export function appendLocalTestResultRecord(record: StoredTestResultRecord): void {
  try {
    const raw = localStorage.getItem(TEST_RESULTS_STORAGE_KEY);
    const list: StoredTestResultRecord[] = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];
    const filtered = safeList.filter((item) => item.id !== record.id);
    localStorage.setItem(TEST_RESULTS_STORAGE_KEY, JSON.stringify([record, ...filtered]));
    window.dispatchEvent(new Event('rskbr:test-results-updated'));
  } catch {
    // Abaikan jika storage penuh atau diblokir
  }
}

function loadStoredTestResults(): StoredTestResultRecord[] {
  try {
    const raw = localStorage.getItem(TEST_RESULTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: StoredTestResultRecord) => ({
      ...item,
      approvalStatus:
        item.approvalStatus === 'Disetujui Staf' ? 'Disetujui Staf' : 'Menunggu ACC Staf',
    }));
  } catch {
    return [];
  }
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['-'];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function downloadCertificateJpeg(record: StoredTestResultRecord): void {
  if (record.approvalStatus !== 'Disetujui Staf' || !record.certificateNumber) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FDFBF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#8B1515';
  ctx.lineWidth = 14;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

  ctx.fillStyle = '#8B1515';
  ctx.fillRect(80, 80, canvas.width - 160, 140);

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PILLBOX MEDICAL CENTER · KOORD. 201', canvas.width / 2, 126);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('SERTIFIKAT HASIL PEMERIKSAAN MEDIS', canvas.width / 2, 180);

  const testTitle =
    record.category === 'psikologi'
      ? 'TES & EVALUASI PSIKOLOGI (GHQ-12 & DASS-21)'
      : 'UJI PENGLIHATAN WARNA (20 LEMPENG ISHIHARA)';

  ctx.fillStyle = '#8B1515';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(testTitle, canvas.width / 2, 275);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 18px monospace';
  ctx.fillText(
    `No. Sertifikat: ${record.certificateNumber}   |   Tanggal: ${record.tanggalTes}`,
    canvas.width / 2,
    315
  );

  ctx.fillStyle = '#475569';
  ctx.font = '600 20px sans-serif';
  ctx.fillText('Diberikan secara resmi kepada:', canvas.width / 2, 375);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText(record.namaPeserta, canvas.width / 2, 440);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, 475);
  ctx.lineTo(canvas.width - 220, 475);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(150, 505, canvas.width - 300, 340);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(150, 505, canvas.width - 300, 340);

  ctx.textAlign = 'left';
  let yCursor = 555;

  const metaLine = [
    record.gender ? `Gender: ${record.gender}` : null,
    record.umur ? `Umur: ${record.umur} Thn` : null,
    record.pekerjaan ? `Pekerjaan: ${record.pekerjaan}` : null,
    record.citizenId ? `Citizen ID: ${record.citizenId}` : null,
  ]
    .filter(Boolean)
    .join('   ·   ');

  if (metaLine) {
    ctx.fillStyle = '#475569';
    ctx.font = '600 20px sans-serif';
    ctx.fillText(metaLine, 190, yCursor);
    yCursor += 42;
  }

  ctx.fillStyle = '#8B1515';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Tujuan Evaluasi: ${record.tujuanEvaluasi}`, 190, yCursor);
  yCursor += 44;

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px monospace';
  const scoreLines = wrapCanvasText(
    ctx,
    `Skor & Penilaian: ${record.skorRingkas}`,
    canvas.width - 380
  );
  for (const line of scoreLines) {
    ctx.fillText(line, 190, yCursor);
    yCursor += 34;
  }

  yCursor += 8;
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 22px sans-serif';
  const interpLines = wrapCanvasText(
    ctx,
    `Interpretasi / Diagnosis: ${record.interpretasi}`,
    canvas.width - 380
  );
  for (const line of interpLines) {
    ctx.fillText(line, 190, yCursor);
    yCursor += 34;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('RS KOTA BARU — UNIT LAYANAN MEDIS & PSIKOLOGI', canvas.width / 2, 925);

  ctx.fillStyle = '#64748B';
  ctx.font = '18px sans-serif';
  ctx.fillText(
    `Disetujui oleh: ${record.reviewedByStaff || 'Tim Medis RS Kota Baru'} · Portal Layanan Paramedic Kota Baru`,
    canvas.width / 2,
    962
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const link = document.createElement('a');
  const safeName = record.namaPeserta
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  link.download = `Sertifikat-${record.category}-${safeName || 'peserta'}-${record.certificateNumber}.jpeg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function TestResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get('tab') === 'buta_warna' ? 'buta_warna' : 'psikologi';

  const [activeCategory, setActiveCategory] = useState<'psikologi' | 'buta_warna'>(
    initialTab
  );
  const [records, setRecords] = useState<StoredTestResultRecord[]>(() =>
    loadStoredTestResults()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<StoredTestResultRecord | null>(
    null
  );

  useEffect(() => {
    if (searchParams.get('tab') === 'buta_warna') {
      setActiveCategory('buta_warna');
    } else if (searchParams.get('tab') === 'psikologi') {
      setActiveCategory('psikologi');
    }
  }, [searchParams]);

  useEffect(() => {
    const syncResults = () => {
      setRecords(loadStoredTestResults());
    };
    window.addEventListener('rskbr:test-results-updated', syncResults);
    window.addEventListener('storage', syncResults);
    return () => {
      window.removeEventListener('rskbr:test-results-updated', syncResults);
      window.removeEventListener('storage', syncResults);
    };
  }, []);

  const handleCategoryTab = (cat: 'psikologi' | 'buta_warna') => {
    setActiveCategory(cat);
    setSearchParams({ tab: cat });
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((item) => item.id !== id);
    setRecords(updated);
    try {
      localStorage.setItem(TEST_RESULTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Abaikan
    }
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records
      .filter((r) => r.category === activeCategory)
      .filter((r) => {
        if (!q) return true;
        return (
          r.namaPeserta.toLowerCase().includes(q) ||
          (r.umur || '').toLowerCase().includes(q) ||
          (r.pekerjaan || '').toLowerCase().includes(q) ||
          r.tujuanEvaluasi.toLowerCase().includes(q) ||
          r.skorRingkas.toLowerCase().includes(q) ||
          r.interpretasi.toLowerCase().includes(q) ||
          (r.certificateNumber || '').toLowerCase().includes(q)
        );
      });
  }, [records, activeCategory, searchQuery]);

  const isPsych = activeCategory === 'psikologi';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              to="/layanan"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B1515] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Loket Pelayanan Medis</span>
            </Link>
            <h1 className="mt-2 font-heading text-3xl font-extrabold text-slate-950">
              {isPsych
                ? 'Data Hasil & Penilaian Tes & Evaluasi Psikologi'
                : 'Data Hasil & Sertifikat Tes Buta Warna'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isPsych
                ? 'Hasil skrining GHQ-12 & DASS-21 lengkap. Sertifikat (.JPEG) terbit setelah di-ACC oleh staf rumah sakit.'
                : 'Hasil uji 20 lempeng Ishihara lengkap. Sertifikat (.JPEG) terbit setelah di-ACC oleh staf rumah sakit.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryTab('psikologi')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                isPsych
                  ? 'bg-[#8B1515] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#8B1515]'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Tes Psikologi</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryTab('buta_warna')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                !isPsych
                  ? 'bg-[#8B1515] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#8B1515]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Tes Buta Warna</span>
            </button>
          </div>
        </div>

        <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-base font-extrabold text-slate-950">
                {isPsych
                  ? 'Data Hasil & Penilaian Tes & Evaluasi Psikologi'
                  : 'Data Hasil Uji Penglihatan Warna (Ishihara)'}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Sertifikat (.JPEG) hanya tersedia setelah hasil tes di-ACC oleh staf RS.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / tujuan / hasil..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-14 text-center">
              <Award className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                Belum ada hasil {isPsych ? 'Tes Psikologi' : 'Tes Buta Warna'} tersimpan.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Selesaikan tes di halaman Loket Pelayanan Medis untuk melihat hasil tes lengkap.
              </p>
              <Link
                to={`/layanan?tab=${encodeURIComponent(
                  isPsych ? 'Tes Psikologi' : 'Tes Buta Warna'
                )}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6D0E0E]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Mulai {isPsych ? 'Tes Psikologi' : 'Tes Buta Warna'}</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1020px] table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                    <th className="w-[15%] px-3 py-3 text-center">Data Peserta</th>
                    <th className="w-[12%] px-3 py-3 text-center">Tanggal</th>
                    <th className="w-[14%] px-3 py-3 text-center">Tujuan Evaluasi</th>
                    <th className="w-[21%] px-3 py-3 text-center">Skor &amp; Penilaian</th>
                    <th className="w-[13%] px-3 py-3 text-center">
                      {isPsych ? 'Interpretasi Psikologis' : 'Diagnosis Warna'}
                    </th>
                    <th className="w-[10%] px-3 py-3 text-center">Status ACC</th>
                    <th className="w-[10%] px-3 py-3 text-center">Detail &amp; Sertifikat</th>
                    <th className="w-[5%] px-2 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map((item) => {
                    const isApproved =
                      item.approvalStatus === 'Disetujui Staf' &&
                      Boolean(item.certificateNumber);

                    return (
                      <tr key={item.id} className="align-middle hover:bg-slate-50/70">
                        <td className="px-3 py-4 text-left">
                          <p className="font-extrabold text-slate-950">{item.namaPeserta}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Umur: {item.umur ? `${item.umur} th` : '-'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pekerjaan: {item.pekerjaan || '-'}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-center font-mono text-[11px] text-slate-600">
                          {item.tanggalTes}
                        </td>

                        <td className="px-3 py-4 text-left font-medium text-slate-700">
                          {item.tujuanEvaluasi}
                        </td>

                        <td className="px-3 py-4 text-left font-mono text-[11px] text-slate-800">
                          {item.psychDetail ? (
                            <div className="space-y-0.5">
                              <p>
                                GHQ-12: <strong>{item.psychDetail.ghqScore}/36</strong> (
                                {item.psychDetail.ghqKategori})
                              </p>
                              <p className="text-slate-600">
                                Depresi: <strong>{item.psychDetail.dassDepresiScore}</strong> (
                                {item.psychDetail.dassDepresiKategori}) · Cemas:{' '}
                                <strong>{item.psychDetail.dassKecemasanScore}</strong> (
                                {item.psychDetail.dassKecemasanKategori})
                              </p>
                              <p className="text-slate-600">
                                Stres: <strong>{item.psychDetail.dassStresScore}</strong> (
                                {item.psychDetail.dassStresKategori})
                              </p>
                            </div>
                          ) : (
                            <span>{item.skorRingkas}</span>
                          )}
                        </td>

                        <td className="px-3 py-4 text-left">
                          <span className="inline-block rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                            {item.interpretasi}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-center">
                          {isApproved ? (
                            <span className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              Di-ACC Staf
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Menunggu ACC Staf</span>
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(item)}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              Hasil &amp; Penilaian
                            </button>

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => downloadCertificateJpeg(item)}
                                className="inline-flex items-center gap-1 rounded-xl bg-[#8B1515] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs transition hover:bg-[#6D0E0E]"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(item.id)}
                              title="Hapus hasil tes"
                              aria-label="Hapus hasil tes"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-[#8B1515]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETAIL HASIL & PENILAIAN (RATA TENGAH & LENGKAP) */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center border-b border-slate-100 pb-4">
              <div>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#8B1515]">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h3 className="mt-2.5 font-heading text-lg font-extrabold text-slate-950">
                  Hasil Lengkap &amp; Penilaian Tes
                </h3>
                <p className="font-mono text-[11px] text-slate-500">
                  {selectedRecord.id} · {selectedRecord.tanggalTes}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="absolute right-0 top-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Identitas Peserta
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-950">
                  {selectedRecord.namaPeserta}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  {[
                    selectedRecord.gender,
                    selectedRecord.umur ? `${selectedRecord.umur} Tahun` : null,
                    selectedRecord.pekerjaan,
                    selectedRecord.citizenId ? `CID: ${selectedRecord.citizenId}` : null,
                    selectedRecord.noHpIc ? `HP: ${selectedRecord.noHpIc}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tujuan Evaluasi
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {selectedRecord.tujuanEvaluasi}
                </p>
              </div>

              {selectedRecord.psychDetail ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B1515]">
                      Skor GHQ-12
                    </p>
                    <p className="mt-1 font-mono text-base font-extrabold text-slate-950">
                      {selectedRecord.psychDetail.ghqScore} / 36
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-700">
                      {selectedRecord.psychDetail.ghqKategori}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B1515]">
                      Rincian DASS-21
                    </p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                      Depresi: {selectedRecord.psychDetail.dassDepresiScore} (
                      {selectedRecord.psychDetail.dassDepresiKategori})
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                      Kecemasan: {selectedRecord.psychDetail.dassKecemasanScore} (
                      {selectedRecord.psychDetail.dassKecemasanKategori})
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                      Stres: {selectedRecord.psychDetail.dassStresScore} (
                      {selectedRecord.psychDetail.dassStresKategori})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B1515]">
                    Skor &amp; Penilaian
                  </p>
                  <p className="mt-1 font-mono text-xs font-extrabold text-slate-900">
                    {selectedRecord.skorRingkas}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Interpretasi / Diagnosis
                </p>
                <p className="mt-1 text-xs font-extrabold text-amber-950">
                  {selectedRecord.interpretasi}
                </p>
              </div>

              {selectedRecord.keluhanSingkat && (
                <div className="rounded-2xl border border-slate-200/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Catatan / Keluhan Singkat
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    {selectedRecord.keluhanSingkat}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px]">
                {selectedRecord.approvalStatus === 'Disetujui Staf' &&
                selectedRecord.certificateNumber ? (
                  <p className="font-bold text-emerald-700">
                    Status: Di-ACC Staf ({selectedRecord.reviewedByStaff || 'Tim Medis RS'}) · No.
                    Sertifikat: <span className="font-mono">{selectedRecord.certificateNumber}</span>
                  </p>
                ) : (
                  <p className="font-semibold text-amber-800">
                    Status: <strong>Menunggu ACC Staf Rumah Sakit</strong> — Sertifikat belum
                    diterbitkan sampai hasil disetujui oleh staf di dashboard.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>

              {selectedRecord.approvalStatus === 'Disetujui Staf' &&
                selectedRecord.certificateNumber && (
                  <button
                    type="button"
                    onClick={() => downloadCertificateJpeg(selectedRecord)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6D0E0E]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Sertifikat JPEG</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestResultsPage;