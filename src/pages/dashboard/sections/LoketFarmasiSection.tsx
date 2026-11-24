import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  Pencil,
  Pill,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

export interface PharmacyOrderItem {
  id: string;
  queueNumber: string;
  orderedAt: string;
  patientName: string;
  pocketNumber: string;
  packageName: string;
  quantity: number;
  totalPrice: number;
  officerName?: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Ditolak';
}

export interface PharmacyPackageCatalogItem {
  id: string;
  badgeLetter: string;
  code: string;
  name: string;
  description: string;
  unitPrice: number;
}

interface LoketFarmasiSectionProps {
  orders?: PharmacyOrderItem[];
  packages?: PharmacyPackageCatalogItem[];
  onNotify?: (msg: string) => void;
}

const DEFAULT_PHARMACY_PACKAGES: PharmacyPackageCatalogItem[] = [
    {
      id: 'pkg-perban-10',
      badgeLetter: 'A',
      code: 'pkg-perban',
      name: 'Paket Perban (10 Pcs)',
      description: '10 Pcs Perban Steril Standar Medis RSKB',
      unitPrice: 20000,
    },
  {
    id: 'pkg-antidepresan',
    badgeLetter: 'B',
    code: 'pkg-1794269229387',
    name: 'Paket Obat Antidepresan',
    description: '5 Obat',
    unitPrice: 20000,
  },
  {
    id: 'pkg-pengobatan',
    badgeLetter: 'C',
    code: 'pkg-1794269279825',
    name: 'Paket Pengobatan',
    description: '10 perban, 5 antidepresan, 5 obat maag',
    unitPrice: 40000,
  },
  {
    id: 'pkg-penyembuhan',
    badgeLetter: 'D',
    code: 'pkg-1794269317281',
    name: 'Paket Penyembuhan',
    description: '15 perban, 5 antidepresan, 5 folavit, 5 obat maag',
    unitPrice: 45000,
  },
];

function formatKbrp(amount: number): string {
  return `$${Math.max(0, amount).toLocaleString('en-US')} KBRP`;
}

function formatDollarShort(amount: number): string {
  return `$${Math.max(0, amount).toLocaleString('id-ID')}`;
}

export function LoketFarmasiSection({
  orders = [],
  packages,
  onNotify,
}: LoketFarmasiSectionProps) {
  const [activeTab, setActiveTab] = useState<'antrean' | 'katalog'>('antrean');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, PharmacyOrderItem['status']>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  const [catalog, setCatalog] = useState<PharmacyPackageCatalogItem[]>(() =>
    packages && packages.length > 0 ? packages : DEFAULT_PHARMACY_PACKAGES
  );

  // State modal tambah / edit paket
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PharmacyPackageCatalogItem | null>(null);
  const [formBadge, setFormBadge] = useState('E');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState<number>(20000);

  const visibleOrders = useMemo(() => {
    return orders
      .filter((o) => !deletedIds[o.id])
      .map((o) => ({
        ...o,
        status: statusOverrides[o.id] ?? o.status,
      }));
  }, [orders, deletedIds, statusOverrides]);

  const waitingCount = visibleOrders.filter((o) => o.status === 'Menunggu').length;
  const processingCount = visibleOrders.filter((o) => o.status === 'Diproses').length;
  const doneCount = visibleOrders.filter((o) => o.status === 'Selesai').length;
  const totalRevenue = visibleOrders
    .filter((o) => o.status === 'Selesai')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const filteredOrders = useMemo(() => {
    return visibleOrders.filter((o) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        o.patientName.toLowerCase().includes(q) ||
        o.pocketNumber.toLowerCase().includes(q) ||
        o.packageName.toLowerCase().includes(q) ||
        o.queueNumber.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [visibleOrders, searchQuery, statusFilter]);

  const catalogStats = useMemo(() => {
    if (catalog.length === 0) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
    }
    const prices = catalog.map((p) => p.unitPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return { minPrice, maxPrice, avgPrice };
  }, [catalog]);

  const openAddModal = () => {
    setEditingPkg(null);
    const nextLetter = String.fromCharCode(65 + (catalog.length % 26));
    setFormBadge(nextLetter);
    setFormName('');
    setFormDesc('');
    setFormPrice(20000);
    setEditorOpen(true);
  };

  const openEditModal = (pkg: PharmacyPackageCatalogItem) => {
    setEditingPkg(pkg);
    setFormBadge(pkg.badgeLetter);
    setFormName(pkg.name);
    setFormDesc(pkg.description);
    setFormPrice(pkg.unitPrice);
    setEditorOpen(true);
  };

  const handleSavePackageModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) return;

    const cleanPrice = Math.max(0, Number(formPrice) || 0);
    const cleanDesc = formDesc.trim() || 'Paket standar loket farmasi';
    const cleanBadge = (formBadge.trim() || 'P').slice(0, 2).toUpperCase();

    if (editingPkg) {
      setCatalog((prev) =>
        prev.map((item) =>
          item.id === editingPkg.id
            ? {
                ...item,
                badgeLetter: cleanBadge,
                name: cleanName,
                description: cleanDesc,
                unitPrice: cleanPrice,
              }
            : item
        )
      );
      onNotify?.(`Paket "${cleanName}" berhasil diperbarui.`);
    } else {
      const created: PharmacyPackageCatalogItem = {
        id: `pkg-${Date.now()}`,
        badgeLetter: cleanBadge,
        code: `pkg-${Date.now()}`,
        name: cleanName,
        description: cleanDesc,
        unitPrice: cleanPrice,
      };
      setCatalog((prev) => [...prev, created]);
      onNotify?.(`Paket baru "${cleanName}" ditambahkan ke katalog.`);
    }

    setEditorOpen(false);
    setEditingPkg(null);
  };

  const handleResetStandard = () => {
    setCatalog(DEFAULT_PHARMACY_PACKAGES);
    onNotify?.('Katalog paket farmasi dikembalikan ke standar.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('antrean')}
          className={`inline-flex items-center gap-2 border-b-2 pb-3 text-xs font-bold transition ${
            activeTab === 'antrean'
              ? 'border-[#8B1515] text-[#8B1515]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Antrean Pesanan Loket</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('katalog')}
          className={`inline-flex items-center gap-2 border-b-2 pb-3 text-xs font-bold transition ${
            activeTab === 'katalog'
              ? 'border-[#8B1515] text-[#8B1515]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="h-4 w-4" />
          <span>Manajemen Paket &amp; Harga</span>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#8B1515]">
            {catalog.length}
          </span>
        </button>
      </div>

      {activeTab === 'antrean' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                  Antrean Pesanan Loket Farmasi
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pesanan obat &amp; perban yang masuk dari layanan publik warga.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <p className="text-[10px] font-extrabold uppercase text-slate-400">
                TOTAL PESANAN
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold text-slate-900">
                {visibleOrders.length}
              </p>
              <p className="text-[10px] text-slate-400">Seluruh antrean farmasi</p>
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5">
              <p className="text-[10px] font-extrabold uppercase text-amber-700">MENUNGGU</p>
              <p className="mt-1 font-mono text-lg font-extrabold text-amber-700">
                {waitingCount}
              </p>
              <p className="text-[10px] text-amber-600/80">Perlu diproses petugas</p>
            </div>
            <div className="rounded-xl border border-sky-200/70 bg-sky-50/40 p-3.5">
              <p className="text-[10px] font-extrabold uppercase text-sky-700">DIPROSES</p>
              <p className="mt-1 font-mono text-lg font-extrabold text-sky-700">
                {processingCount}
              </p>
              <p className="text-[10px] text-sky-600/80">Sedang disiapkan</p>
            </div>
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5">
              <p className="text-[10px] font-extrabold uppercase text-emerald-700">SELESAI</p>
              <p className="mt-1 font-mono text-lg font-extrabold text-emerald-700">
                {doneCount}
              </p>
              <p className="text-[10px] text-emerald-600/80">Obat &amp; perban diserahkan</p>
            </div>
            <div className="rounded-xl bg-[#8B1515] p-3.5 text-white">
              <p className="text-[10px] font-extrabold uppercase text-rose-100">
                TOTAL PENDAPATAN
              </p>
              <p className="mt-1 font-mono text-base font-extrabold">
                {formatKbrp(totalRevenue)}
              </p>
              <p className="text-[10px] text-rose-100/80">Dari pesanan selesai</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'Menunggu', 'Diproses', 'Selesai', 'Ditolak'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === st
                      ? 'bg-[#8B1515] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / no kantong..."
                className="h-9 w-full rounded-xl border border-slate-200 pr-3 pl-8 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-3 text-left">NO / ID</th>
                  <th className="px-3 py-3 text-left">WAKTU PESAN</th>
                  <th className="px-3 py-3 text-left">NAMA PASIEN</th>
                  <th className="px-3 py-3 text-center">NO. KANTONG</th>
                  <th className="px-3 py-3 text-left">PAKET YANG DIBELI</th>
                  <th className="px-3 py-3 text-center">JUMLAH</th>
                  <th className="px-3 py-3 text-right">TOTAL BIAYA</th>
                  <th className="px-3 py-3 text-center">STATUS</th>
                  <th className="px-3 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                      Belum ada antrean pesanan loket farmasi dari warga.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="align-middle transition hover:bg-slate-50/60">
                      <td className="px-3 py-3.5 text-left font-mono text-[11px] font-bold text-slate-700">
                        {ord.queueNumber}
                      </td>
                      <td className="px-3 py-3.5 text-left font-mono text-[11px] text-slate-500">
                        {ord.orderedAt}
                      </td>
                      <td className="px-3 py-3.5 text-left font-bold text-slate-900">
                        {ord.patientName}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#8B1515]">
                          {ord.pocketNumber}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-left font-semibold text-slate-800">
                        {ord.packageName}
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700">
                        {ord.quantity}x
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatKbrp(ord.totalPrice)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            ord.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ord.status === 'Ditolak'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          {ord.status !== 'Selesai' && (
                            <button
                              type="button"
                              onClick={() => {
                                setStatusOverrides((prev) => ({ ...prev, [ord.id]: 'Selesai' }));
                                onNotify?.('Pesanan farmasi ditandai Selesai.');
                              }}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                            >
                              Selesai
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDeletedIds((prev) => ({ ...prev, [ord.id]: true }));
                              onNotify?.('Pesanan dihapus dari antrean.');
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
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-extrabold text-slate-900">
                    Katalog Paket Obat &amp; Perban Farmasi
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tambahkan paket baru, ubah rincian nama atau isi paket, dan atur harga satuan
                    dalam mata uang KBRP. Perubahan langsung tersinkronisasi ke formulir pesanan
                    publik.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetStandard}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset ke Standar</span>
                </button>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#6E0F0F]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Paket Baru</span>
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                TOTAL PAKET AKTIF
              </p>
              <p className="mt-1 font-heading text-xl font-extrabold text-slate-900">
                {catalog.length} Paket
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Tersedia di loket farmasi</p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                PAKET TERMURAH
              </p>
              <p className="mt-1 font-mono text-xl font-extrabold text-emerald-600">
                {formatDollarShort(catalogStats.minPrice)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Harga minimum saat ini</p>
            </div>

            <div className="rounded-2xl border border-sky-200/80 bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                PAKET TERMAHAL
              </p>
              <p className="mt-1 font-mono text-xl font-extrabold text-sky-600">
                {formatDollarShort(catalogStats.maxPrice)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Harga maksimum paket bundle</p>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                RATA-RATA HARGA
              </p>
              <p className="mt-1 font-mono text-xl font-extrabold text-amber-600">
                {formatDollarShort(catalogStats.avgPrice)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Rerata per paket KBRP</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {catalog.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-xs text-slate-400">
                Belum ada paket farmasi terdaftar. Klik &ldquo;Tambah Paket Baru&rdquo; atau
                &ldquo;Reset ke Standar&rdquo;.
              </div>
            ) : (
              catalog.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-rose-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 font-heading text-xs font-extrabold text-[#8B1515]">
                          {pkg.badgeLetter}
                        </div>
                        <div>
                          <h3 className="font-heading text-sm font-extrabold text-slate-900">
                            {pkg.name}
                          </h3>
                          <p className="font-mono text-[10px] text-slate-400">
                            Kode ID: {pkg.code}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-sm font-extrabold text-[#8B1515]">
                          {formatKbrp(pkg.unitPrice)}
                        </p>
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          HARGA SATUAN
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <p className="text-[10px] font-bold text-slate-400">
                        Deskripsi / Isi Paket:
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">
                        {pkg.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCatalog((prev) =>
                            prev.map((item) =>
                              item.id === pkg.id
                                ? { ...item, unitPrice: Math.max(0, item.unitPrice - 5000) }
                                : item
                            )
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        -$5K
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCatalog((prev) =>
                            prev.map((item) =>
                              item.id === pkg.id
                                ? { ...item, unitPrice: item.unitPrice + 5000 }
                                : item
                            )
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        +$5K
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(pkg)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit &amp; Harga</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalog((prev) => prev.filter((item) => item.id !== pkg.id));
                          onNotify?.(`Paket "${pkg.name}" dihapus dari katalog.`);
                        }}
                        className="inline-flex items-center rounded-lg border border-rose-200 bg-white p-1.5 text-[#8B1515] transition hover:bg-rose-50"
                        title="Hapus paket"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  {editingPkg ? 'Edit Paket & Harga Farmasi' : 'Tambah Paket Farmasi Baru'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Perubahan otomatis tersinkron ke layanan publik
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackageModal} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">KodeHuruf</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value.toUpperCase())}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-center font-heading font-extrabold uppercase focus:border-[#8B1515] focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="mb-1 block font-bold text-slate-700">Nama Paket *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Paket Obat Antidepresan"
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 focus:border-[#8B1515] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Deskripsi / Isi Paket *
                </label>
                <input
                  type="text"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Contoh: 10 perban, 5 antidepresan, 5 obat maag"
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 focus:border-[#8B1515] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Harga Satuan (KBRP) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 font-mono font-bold focus:border-[#8B1515] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#8B1515] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#6E0F0F]"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}