import React, { useMemo, useState } from 'react';
import { Award, Eye, Search, Trash2, X } from 'lucide-react';

export interface SkwbClaims {
  freeOplas: boolean;
  discountTreatment: boolean;
  freeBandage: boolean;
}

export interface SkwbBenefitItem {
  id: string;
  icName: string;
  birthDate: string;
  issuedDate: string;
  validFrom: string;
  validUntil: string;
  status: 'Aktif' | 'Kadaluarsa';
  photoUrl?: string;
  photoLabel?: string;
  claims: SkwbClaims;
}

interface BenefitSkwbSectionProps {
  records?: SkwbBenefitItem[];
  onNotify?: (msg: string) => void;
}

interface SkwbModalState {
  title: string;
  subtitle: string;
  imageUrl?: string;
  details: Array<{ label: string; value: string }>;
}

export function BenefitSkwbSection({
  records = [],
  onNotify,
}: BenefitSkwbSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'Aktif' | 'Kadaluarsa'>('ALL');
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [claimOverrides, setClaimOverrides] = useState<Record<string, SkwbClaims>>({});
  const [modalInfo, setModalInfo] = useState<SkwbModalState | null>(null);

  const visibleBase = useMemo(() => {
    return records
      .filter((r) => !deletedIds[r.id])
      .map((r) => ({
        ...r,
        claims: claimOverrides[r.id] ?? r.claims,
      }));
  }, [records, deletedIds, claimOverrides]);

  const activeCount = visibleBase.filter((r) => r.status === 'Aktif').length;
  const expiredCount = visibleBase.filter((r) => r.status === 'Kadaluarsa').length;

  const filtered = useMemo(() => {
    return visibleBase.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.icName.toLowerCase().includes(q) ||
        r.birthDate.toLowerCase().includes(q) ||
        r.issuedDate.toLowerCase().includes(q);
      const matchTab = filterTab === 'ALL' || r.status === filterTab;
      return matchQuery && matchTab;
    });
  }, [visibleBase, searchQuery, filterTab]);

  const toggleClaim = (
    id: string,
    current: SkwbClaims,
    key: keyof SkwbClaims
  ) => {
    setClaimOverrides((prev) => ({
      ...prev,
      [id]: { ...current, [key]: !current[key] },
    }));
    onNotify?.('Status klaim benefit SKWB diperbarui.');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-extrabold text-slate-900">
                Benefit SKWB (Warga Baru)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Manajemen klaim benefit SKWB warga yang masuk dari layanan publik.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
              Total SKWB: {visibleBase.length}
            </span>
            <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Aktif: {activeCount}
            </span>
            <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-[#8B1515]">
              Kadaluarsa: {expiredCount}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Nama IC, Tanggal Lahir, atau Tanggal Terbit SKWB..."
              className="h-9 w-full rounded-xl border border-slate-200 pr-3.5 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'Aktif', 'Kadaluarsa'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  filterTab === tab
                    ? 'bg-[#8B1515] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab === 'ALL' ? 'Semua' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="px-3 py-3 text-left">NAMA IC</th>
                <th className="px-3 py-3 text-left">TGL LAHIR</th>
                <th className="px-3 py-3 text-left">TGL TERBIT SKWB</th>
                <th className="px-3 py-3 text-left">MASA BERLAKU</th>
                <th className="px-3 py-3 text-center">STATUS BENEFIT</th>
                <th className="px-3 py-3 text-center">FOTO SKWB</th>
                <th className="px-3 py-3 text-left">STATUS MASING-MASING BENEFIT</th>
                <th className="px-3 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Belum ada data Benefit SKWB yang masuk dari warga.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="align-middle transition hover:bg-slate-50/60">
                    <td className="px-3 py-3.5 text-left font-bold text-slate-900">
                      {item.icName}
                    </td>
                    <td className="px-3 py-3.5 text-left font-mono text-[11px] text-slate-600">
                      {item.birthDate}
                    </td>
                    <td className="px-3 py-3.5 text-left font-mono text-[11px] font-semibold text-slate-800">
                      {item.issuedDate}
                    </td>
                    <td className="px-3 py-3.5 text-left font-mono text-[11px] text-slate-600">
                      {item.validFrom} s/d {item.validUntil}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {item.photoUrl || item.photoLabel ? (
                        <button
                          type="button"
                          onClick={() =>
                            setModalInfo({
                              title: `Foto SKWB · ${item.icName}`,
                              subtitle: `Terbit: ${item.issuedDate}`,
                              imageUrl: item.photoUrl,
                              details: [
                                { label: 'Nama IC', value: item.icName },
                                { label: 'Berkas', value: item.photoLabel || 'Lampiran SKWB' },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1 text-[11px] font-bold text-[#8B1515] hover:bg-rose-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat Foto</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-left">
                      <div className="flex flex-col items-start gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => toggleClaim(item.id, item.claims, 'freeOplas')}
                          className={`rounded-md px-2 py-0.5 ${
                            item.claims.freeOplas
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Free Oplas: {item.claims.freeOplas ? 'Sudah Diklaim' : 'Belum Diklaim'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleClaim(item.id, item.claims, 'discountTreatment')}
                          className={`rounded-md px-2 py-0.5 ${
                            item.claims.discountTreatment
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Diskon Treatment:{' '}
                          {item.claims.discountTreatment ? 'Sudah Diklaim' : 'Belum Diklaim'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleClaim(item.id, item.claims, 'freeBandage')}
                          className={`rounded-md px-2 py-0.5 ${
                            item.claims.freeBandage
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Gratis Perban:{' '}
                          {item.claims.freeBandage ? 'Sudah Diklaim' : 'Belum Diklaim'}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setModalInfo({
                              title: `Detail Benefit SKWB · ${item.icName}`,
                              subtitle: `Status: ${item.status}`,
                              imageUrl: item.photoUrl,
                              details: [
                                { label: 'Nama IC', value: item.icName },
                                { label: 'Tanggal Lahir', value: item.birthDate },
                                { label: 'Tanggal Terbit', value: item.issuedDate },
                                {
                                  label: 'Masa Berlaku',
                                  value: `${item.validFrom} s/d ${item.validUntil}`,
                                },
                              ],
                            })
                          }
                          className="rounded-lg bg-[#8B1515] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#6E0F0F]"
                        >
                          Kelola &amp; Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletedIds((prev) => ({ ...prev, [item.id]: true }));
                            onNotify?.('Data SKWB dihapus dari daftar.');
                          }}
                          className="inline-flex items-center rounded-lg border border-rose-200 bg-white p-1.5 text-[#8B1515] hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setModalInfo(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  {modalInfo.title}
                </h3>
                <p className="font-mono text-[11px] text-slate-400">{modalInfo.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalInfo(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {modalInfo.details.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2"
                >
                  <span className="font-semibold text-slate-500">{d.label}</span>
                  <span className="font-bold text-slate-900">{d.value}</span>
                </div>
              ))}
              {modalInfo.imageUrl && (
                <img
                  src={modalInfo.imageUrl}
                  alt={modalInfo.title}
                  className="mt-3 max-h-72 w-full rounded-xl border border-slate-200 object-contain"
                />
              )}
            </div>
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setModalInfo(null)}
                className="rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0F0F]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}