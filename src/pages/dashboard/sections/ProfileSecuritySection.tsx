import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react';
import { ROLE_LEVELS } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import type { PortalStaffMember } from '../types';

interface ProfileSecuritySectionProps {
  currentUser: PortalStaffMember;
  onUpdateAvatar?: (dataUrl: string) => void;
  onUpdatePassword?: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<boolean | void> | boolean | void;
  onUpdateEmail?: (payload: {
    currentPassword: string;
    newEmail: string;
  }) => Promise<boolean | void> | boolean | void;
  onNotify?: (msg: string) => void;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/^(dr\.|ns\.|apt\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function resolveStaffPhoto(staff: unknown, fallbackUid?: string): string {
  if (staff && typeof staff === 'object') {
    const record = staff as Record<string, unknown>;
    const candidates = [
      record.fotoUrl,
      record.avatarUrl,
      record.photoUrl,
      record.foto,
      record.avatar,
    ];
    for (const val of candidates) {
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }
  }

  const uid =
    (staff && typeof staff === 'object' && typeof (staff as { uid?: unknown }).uid === 'string'
      ? (staff as { uid: string }).uid
      : '') || fallbackUid;

  if (uid && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(`rskb_avatar_${uid}`);
      if (saved && saved.trim().length > 0) {
        return saved.trim();
      }
    } catch {
      // Abaikan error akses localStorage
    }
  }

  return '';
}

function compressImageToDataUrl(file: File, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width || maxSize, img.height || maxSize));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof reader.result === 'string' ? reader.result : '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputMime, 0.85));
      };
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileSecuritySection({
  currentUser,
  onUpdateAvatar,
  onUpdatePassword,
  onUpdateEmail,
  onNotify,
}: ProfileSecuritySectionProps) {
  const syncedPhoto = resolveStaffPhoto(currentUser, currentUser.uid);
  const joinedDate =
    (currentUser as { tanggalBergabung?: string }).tanggalBergabung ?? '2026-11-02';

  const [avatarPreview, setAvatarPreview] = useState<string>(syncedPhoto);

  useEffect(() => {
    setAvatarPreview(syncedPhoto);
  }, [syncedPhoto]);

  // State Ganti Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassFields, setShowPassFields] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // State Pengaturan Email
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const notify = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
    }
  };

  const passwordChecks = useMemo(() => {
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*]/.test(newPassword);
    const matchesConfirm =
      confirmPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword;

    return [
      { id: 'upper', label: 'Minimal 1 huruf besar (Uppercase)', valid: hasUpper },
      { id: 'lower', label: 'Minimal 1 huruf kecil (Lowercase)', valid: hasLower },
      { id: 'number', label: 'Minimal 1 angka (Number)', valid: hasNumber },
      { id: 'symbol', label: 'Minimal 1 simbol (!@#$%^&*)', valid: hasSymbol },
      { id: 'match', label: 'Konfirmasi password cocok', valid: matchesConfirm },
    ];
  }, [newPassword, confirmPassword]);

  const isPasswordFormValid =
    currentPassword.trim().length > 0 && passwordChecks.every((item) => item.valid);

  const isEmailFormValid =
    emailCurrentPassword.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim()) &&
    newEmail.trim().toLowerCase() === confirmEmail.trim().toLowerCase() &&
    newEmail.trim().toLowerCase() !== currentUser.email.toLowerCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const isAllowedExt = /\.(png|jpe?g)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      notify('Pilih file gambar berformat .PNG atau .JPG.');
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file, 320);
      if (!dataUrl) return;

      setAvatarPreview(dataUrl);

      if (typeof window !== 'undefined' && window.localStorage && currentUser.uid) {
        try {
          window.localStorage.setItem(`rskb_avatar_${currentUser.uid}`, dataUrl);
        } catch {
          // Abaikan jika penyimpanan penuh
        }
      }

      if (onUpdateAvatar) {
        onUpdateAvatar(dataUrl);
      }

      notify('Foto profil baru (.PNG / .JPG) berhasil dipasang.');
    } catch {
      notify('Gagal memproses gambar. Coba file .PNG atau .JPG lain.');
    } finally {
      e.target.value = '';
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordFormValid) return;

    setIsSavingPassword(true);
    try {
      if (onUpdatePassword) {
        const res = await onUpdatePassword({ currentPassword, newPassword });
        if (res === false) return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify('Password akun berhasil diperbarui.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailFormValid) return;

    setIsSavingEmail(true);
    try {
      if (onUpdateEmail) {
        const res = await onUpdateEmail({
          currentPassword: emailCurrentPassword,
          newEmail: newEmail.trim(),
        });
        if (res === false) return;
      }
      setEmailCurrentPassword('');
      setNewEmail('');
      setConfirmEmail('');
      notify('Alamat email akun berhasil diperbarui.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kartu Ringkasan Profil */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="h-2 w-full bg-gradient-to-r from-[#6E0F0F] via-[#8B1515] to-[#B91C1C]" />

        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={formatStaffDisplayName(currentUser)}
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-2xs"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50/70 font-heading text-2xl font-extrabold text-[#8B1515]">
                {getInitials(formatStaffDisplayName(currentUser))}
              </div>
            )}
            <span className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <UserCheck className="h-3 w-3" />
              Akun Aktif
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-extrabold text-slate-900">
                {formatStaffDisplayName(currentUser)}
              </h2>
              <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#8B1515]">
                {currentUser.role} (Level {ROLE_LEVELS[currentUser.role] ?? 1})
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                Divisi {currentUser.divisi}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Email: <strong className="font-semibold text-slate-700">{currentUser.email}</strong>
              </span>
              <span>·</span>
              <span>
                NIP: <strong className="font-mono text-slate-700">{currentUser.nip}</strong>
              </span>
              <span>·</span>
              <span>
                Bergabung: <strong className="font-mono text-slate-700">{joinedDate}</strong>
              </span>
            </div>

            <div className="pt-1.5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50/50 hover:text-[#8B1515]">
                <Upload className="h-3.5 w-3.5 text-[#8B1515]" />
                <span>Upload Foto Profil Baru (.PNG / .JPG) — Live Preview</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Grid 2 Kolom: Ganti Password & Pengaturan Email */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Ganti Password */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Ganti Password
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pastikan password baru memenuhi seluruh kriteria keamanan di bawah.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassFields((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
            >
              {showPassFields ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Lihat Input
                </>
              )}
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Password Saat Ini <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type={showPassFields ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password aktif Anda"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Password Baru <span className="text-[#8B1515]">*</span>
                </label>
                <input
                  type={showPassFields ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Buat password baru"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs focus:border-[#8B1515] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Konfirmasi Password Baru <span className="text-[#8B1515]">*</span>
                </label>
                <input
                  type={showPassFields ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs focus:border-[#8B1515] focus:outline-none"
                />
              </div>
            </div>

            {/* Kotak Validasi Keamanan Password Real-time */}
            <div className="rounded-2xl border border-rose-200/80 bg-[#FFF9F8] p-4">
              <p className="font-heading text-xs font-extrabold text-slate-900">
                Validasi Keamanan Password Real-time:
              </p>

              <div className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`flex items-center gap-2.5 text-xs ${
                      check.valid ? 'font-bold text-emerald-700' : 'font-medium text-slate-500'
                    }`}
                  >
                    {check.valid ? (
                      <Check className="h-4 w-4 shrink-0 stroke-[2.5] text-emerald-600" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-400/80 bg-white" />
                    )}
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPasswordFormValid || isSavingPassword}
              className={`w-full rounded-xl py-2.5 text-xs font-extrabold transition ${
                isPasswordFormValid && !isSavingPassword
                  ? 'bg-[#8B1515] text-white shadow-2xs hover:bg-[#6E0F0F]'
                  : 'cursor-not-allowed bg-rose-200/80 text-white'
              }`}
            >
              {isSavingPassword ? 'Menyimpan Password...' : 'Simpan Password Baru'}
            </button>
          </form>
        </section>

        {/* Pengaturan Email */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                Pengaturan Email
              </h3>
              <p className="text-[11px] text-slate-500">
                Perbarui alamat email resmi yang terhubung ke portal.
              </p>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="mb-1.5 block font-bold text-slate-700">Email Saat Ini</label>
              <input
                type="email"
                readOnly
                value={currentUser.email}
                className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium text-slate-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Password Saat Ini <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type="password"
                required
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                placeholder="Verifikasi password saat ini"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Email Baru <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nama.baru@rskotabaru.id"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Konfirmasi Email Baru <span className="text-[#8B1515]">*</span>
              </label>
              <input
                type="email"
                required
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Ulangi email baru"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B1515]" />
              <span>
                Perubahan email akan digunakan untuk notifikasi akun dan pemulihan akses portal.
              </span>
            </div>

            <button
              type="submit"
              disabled={!isEmailFormValid || isSavingEmail}
              className={`w-full rounded-xl py-2.5 text-xs font-extrabold transition ${
                isEmailFormValid && !isSavingEmail
                  ? 'bg-[#8B1515] text-white shadow-2xs hover:bg-[#6E0F0F]'
                  : 'cursor-not-allowed bg-[#8B1515]/85 text-white hover:bg-[#6E0F0F]'
              }`}
            >
              {isSavingEmail ? 'Memperbarui Email...' : 'Perbarui Email'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}