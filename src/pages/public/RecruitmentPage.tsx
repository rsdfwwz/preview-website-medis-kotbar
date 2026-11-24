import React, { useState } from 'react';
import { CheckCircle2, ClipboardCheck, Send, UserPlus } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

export function RecruitmentPage() {
  const { submitRecruitment } = usePortal();

  const [namaIc, setNamaIc] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [umurIc, setUmurIc] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [pengalamanMedis, setPengalamanMedis] = useState('');
  const [motivasi, setMotivasi] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaIc.trim() || !citizenId.trim() || !discordTag.trim()) return;

    submitRecruitment({
      namaIc: namaIc.trim(),
      citizenId: citizenId.trim().toUpperCase(),
      umurIc: umurIc.trim(),
      discordTag: discordTag.trim(),
      pengalamanMedis: pengalamanMedis.trim(),
      motivasi: motivasi.trim(),
    });

    setSubmitted(true);
    setNamaIc('');
    setCitizenId('');
    setUmurIc('');
    setDiscordTag('');
    setPengalamanMedis('');
    setMotivasi('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-3xl bg-slate-900 p-7 text-white">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-300">
                <UserPlus className="h-3.5 w-3.5" />
                Karir Medis Kota Baru
              </div>
              <h1 className="mt-3 font-heading text-2xl font-extrabold">
                Recruitment Paramedic RS Kota Baru
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Bergabunglah bersama tim medis profesional Kota Baru Roleplay mulai dari jenjang{' '}
                <strong>Medical Student / Trainee</strong> hingga Dokter Spesialis.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-slate-900">
                <ClipboardCheck className="h-4 w-4 text-teal-600" />
                Persyaratan Pendaftaran
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li>• Warga aktif Kota Baru Roleplay (KBR) minimal usia IC 20 tahun.</li>
                <li>• Memiliki Surat Keterangan Sehat (SKS) & Bebas Buta Warna.</li>
                <li>• Tidak memiliki catatan kriminal berat (SKCK bersih).</li>
                <li>• Siap mematuhi SOP medis, aturan duty Discord, dan hierarki pangkat RS.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
            >
              <h2 className="font-heading text-xl font-bold text-slate-900">
                Formulir Lamaran Calon Tenaga Medis
              </h2>

              {submitted && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>
                    Lamaran Anda berhasil masuk ke meja HRD RS Kota Baru! Pantau pengumuman
                    wawancara melalui Discord resmi kota.
                  </span>
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Lengkap (IC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaIc}
                    onChange={(e) => setNamaIc(e.target.value)}
                    placeholder="Contoh: Damian Saputra"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Citizen ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="Contoh: KBR-91045"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Umur (IC) *</label>
                  <input
                    type="text"
                    required
                    value={umurIc}
                    onChange={(e) => setUmurIc(e.target.value)}
                    placeholder="Contoh: 24 Tahun"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Username Discord (Untuk Pemanggilan) *
                  </label>
                  <input
                    type="text"
                    required
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    placeholder="Contoh: damiansaputra"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Pengalaman Medis / Organisasi Sebelumnya *
                </label>
                <textarea
                  rows={2}
                  required
                  value={pengalamanMedis}
                  onChange={(e) => setPengalamanMedis(e.target.value)}
                  placeholder="Ceritakan pengalaman medis atau pelayanan publik Anda..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Motivasi Bergabung di RS Kota Baru *
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivasi}
                  onChange={(e) => setMotivasi(e.target.value)}
                  placeholder="Mengapa Anda tertarik menjadi bagian dari Paramedic Kota Baru?"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-teal-700"
              >
                <Send className="h-4 w-4" />
                Kirim Lamaran Recruitment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}