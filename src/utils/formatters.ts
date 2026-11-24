import { ROLE_LEVELS, type DutyStatus, type RoleName, type StaffProfile } from '@/types';

/**
 * Memformat nama IC staf secara otomatis sesuai pangkat & gelar medis
 * Contoh: "Louis Benedict" + Role "Doctor" => "Dr. Louis Benedict"
 */
export function formatStaffDisplayName(
  staff: Pick<StaffProfile, 'namaIc' | 'role' | 'spesialisasi' | 'memilikiGelarDokter'>
): string {
  const cleanName = staff.namaIc.trim();

  if (staff.role === 'Nurse') {
    return `Ns. ${cleanName}`;
  }

  if (staff.role === 'Pharmacist') {
    return `Apt. ${cleanName}`;
  }

  if (staff.role === 'Doctor') {
    return `Dr. ${cleanName}`;
  }

  if (staff.role === 'Doctor Specialist') {
    const spec = staff.spesialisasi?.trim();
    return spec ? `Dr. ${cleanName}, ${spec}` : `Dr. ${cleanName}, Sp.`;
  }

  // Untuk petinggi (Lv. 8-12) yang juga seorang Dokter
  if (staff.memilikiGelarDokter) {
    const spec = staff.spesialisasi?.trim();
    return spec ? `Dr. ${cleanName}, ${spec}` : `Dr. ${cleanName}`;
  }

  return cleanName;
}

/**
 * Mengecek apakah pangkat masuk kategori Petinggi / Manajemen (Level >= 8: HRD s/d Hospital Comitee)
 */
export function isExecutiveRole(role: RoleName): boolean {
  return ROLE_LEVELS[role] >= 8;
}

/**
 * Format mata uang KBRP (Contoh: $25.000 KBRP)
 */
export function formatKbrp(amount: number): string {
  return `$${new Intl.NumberFormat('id-ID').format(amount)} KBRP`;
}

/**
 * Mengubah total menit menjadi format "X Jam Y Menit"
 */
export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 Menit';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} Menit`;
  if (minutes === 0) return `${hours} Jam`;
  return `${hours} Jam ${minutes} Menit`;
}

/**
 * Badge visual status On-Duty / Off-Duty
 */
export function getDutyStatusBadge(status: DutyStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'on_duty':
      return {
        label: 'ON DUTY',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500 animate-pulse',
      };
    case 'cuti':
      return {
        label: 'CUTI / IZIN',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    default:
      return {
        label: 'OFF DUTY',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}