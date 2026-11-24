import { Calendar, Megaphone, Pin, UserCheck } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

export function AnnouncementsPage() {
  const { announcements } = usePortal();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#9E1B21]">
          Buletin Resmi Rumah Sakit
        </span>
        <h1 className="font-heading mt-1 text-3xl font-extrabold text-slate-900">
          Pengumuman &amp; Informasi Publik
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Kabar terbaru seputar pelayanan kesehatan warga, jadwal bakti sosial medis, dan
          informasi pembukaan rekrutmen Paramedic Kota Baru.
        </p>
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Belum ada pengumuman yang dipublikasikan.
          </div>
        ) : (
          announcements.map((ann) => (
          <article
            key={ann.id}
            className={`rounded-2xl border bg-white p-6 shadow-sm sm:p-8 ${
              ann.penting ? 'border-[#9E1B21]/40 ring-1 ring-[#9E1B21]/10' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FDF2F2] px-3 py-1 text-xs font-semibold text-[#9E1B21]">
                  <Megaphone className="h-3.5 w-3.5" />
                  {ann.kategori}
                </span>
                {ann.penting && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Pin className="h-3 w-3" />
                    Prioritas
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  {ann.penulis}
                </span>
                <span className="tabular-nums-mono inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {ann.dipublikasikanPada}
                </span>
              </div>
            </div>

            <h2 className="font-heading mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
              {ann.judul}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{ann.isi}</p>
          </article>
          ))
        )}
      </div>
    </div>
  );
}