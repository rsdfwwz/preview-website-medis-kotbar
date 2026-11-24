import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { formatStaffDisplayName } from '@/utils/formatters';

export function LoginPage() {
  const { staffList, loginStaff, loginDemoAs, registerStaffAccount } = usePortal();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('louis.benedict@rskotabaru.id');
  const [password, setPassword] = useState('kotabaru2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State Form Pendaftaran Akun Staff Baru
  const [regNamaIc, setRegNamaIc] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDiscordId, setRegDiscordId] = useState('');
  const [regDiscordUser, setRegDiscordUser] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Validasi keamanan password real-time
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasLowercase = /[a-z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const hasSymbol = /[!@#$%^&*]/.test(regPassword);
  const isPasswordMatch =
    regConfirmPassword.length > 0 && regPassword === regConfirmPassword;
  const isAllPasswordValid =
    hasUppercase && hasLowercase && hasNumber && hasSymbol && isPasswordMatch;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await loginStaff(email, password);
    if (!res.ok) {
      setErrorMsg(res.error || 'Gagal masuk ke sistem.');
      return;
    }
    navigate('/dashboard');
  };

  const handleQuickDemo = (uid: string) => {
    loginDemoAs(uid);
    navigate('/dashboard');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAllPasswordValid) {
      setErrorMsg(
        'Pastikan password memenuhi seluruh kriteria keamanan dan konfirmasi password cocok.'
      );
      return;
    }

    const generatedNip = `RSKBR-${Date.now().toString().slice(-4)}`;

    const res = registerStaffAccount({
      namaIc: regNamaIc,
      nip: generatedNip,
      email: regEmail,
      password: regPassword,
      discordId: regDiscordId,
      discordUsername: regDiscordUser,
      role: 'Medical Student',
      divisi: 'IGD',
    } as Parameters<typeof registerStaffAccount>[0]);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setRegNamaIc('');
    setRegEmail('');
    setRegDiscordId('');
    setRegDiscordUser('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const demoAccounts = (staffList ?? []).filter((s) => s.statusAkun === 'aktif').slice(0, 3);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 py-8 sm:py-12">
      {/* Dekorasi Latar Halus */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-red-100/60 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Bar Atas: Kembali ke Beranda */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-red-200 hover:bg-red-50/40 hover:text-red-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Portal Publik
          </Link>

          <span className="hidden items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-bold text-red-800 sm:inline-flex">
            <Lock className="h-3 w-3" />
            Sistem Internal RS Kota Baru (KBRP)
          </span>
        </div>

        {/* Kartu Utama */}
        <div className="grid overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-12">
          {/* PANEL KIRI: Branding KBRP & Akses Cepat Demo */}
          <div className="relative flex flex-col justify-between bg-gradient-to-br from-[#8B1515] via-[#660C0C] to-slate-950 p-7 text-white sm:p-9 lg:col-span-5">
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-amber-400/10 blur-2xl" />

            <div>
              {/* Identitas Logo KBRP */}
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/20 backdrop-blur-xs">
                  <img
                    src="/logo.png"
                    alt="Logo RS Kota Baru (KBRP)"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                    Pillbox Medical Center
                  </p>
                  <h2 className="font-heading text-base font-extrabold tracking-tight text-white">
                    RS KOTA BARU (KBRP)
                  </h2>
                </div>
              </div>

              <h1 className="mt-7 font-heading text-2xl font-extrabold leading-snug tracking-tight text-white">
                Portal Kerja & Rekam Medis Staff
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-red-100/80">
                Akses khusus tenaga medis, dokter spesialis, dan jajaran direksi untuk mengelola
                antrean layanan, penerbitan surat resmi, serta laporan tugas.
              </p>

              {/* Kartu Akses Cepat Demo */}
              <div className="mt-7 rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Akses Cepat Uji Coba (Demo)
                  </p>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-red-100">
                    1-Klik
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {demoAccounts.map((acc) => {
                    const initials = (acc.namaIc || 'DR')
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('');
                    return (
                      <button
                        key={acc.uid}
                        type="button"
                        onClick={() => handleQuickDemo(acc.uid)}
                        className="group flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-amber-300/50 hover:bg-white/15"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 font-heading text-[11px] font-extrabold text-white">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-heading text-xs font-bold text-white">
                              {formatStaffDisplayName(acc)}
                            </p>
                            <p className="truncate text-[10px] text-red-200/85">
                              {acc.role} · {acc.divisi}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#8B1515] transition group-hover:bg-amber-300 group-hover:text-slate-950">
                          Masuk
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-4 text-[11px] text-red-100/75">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
              <span>Terintegrasi dengan Bot Discord Duty & Sistem Penggajian KBRP.</span>
            </div>
          </div>

          {/* PANEL KANAN: Form Login & Pendaftaran Staff */}
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:col-span-7">
            {/* Switcher Tab */}
            <div className="grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  mode === 'login'
                    ? 'bg-white text-[#8B1515] shadow-xs ring-1 ring-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Masuk Akun Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  mode === 'register'
                    ? 'bg-white text-[#8B1515] shadow-xs ring-1 ring-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Daftar Akun Baru
              </button>
            </div>

            {errorMsg && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-extrabold text-slate-950">
                    Selamat Datang Kembali
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Masukkan kredensial dinas RS Kota Baru (KBRP) Anda untuk melanjutkan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Email Dinas RS Kota Baru
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@rskotabaru.id"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 transition focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">Kata Sandi</label>
                    <span className="text-[11px] font-medium text-slate-400">
                      Lupa sandi? Hubungi Direksi
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-11 text-sm text-slate-900 transition focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B1515] py-3.5 text-sm font-bold text-white shadow-md shadow-red-900/15 transition hover:bg-[#6D0E0E]"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk ke Dashboard Medis
                </button>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-[11px] leading-relaxed text-slate-500">
                  <strong className="font-bold text-slate-700">Catatan Warga:</strong> Jika Anda
                  warga kota yang ingin membuat SKS, Janji Temu Poli, atau membeli obat farmasi,
                  Anda tidak perlu login—silakan langsung buka menu{' '}
                  <Link to="/layanan" className="font-bold text-[#8B1515] underline">
                    Layanan Medis
                  </Link>
                  .
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <h2 className="font-heading text-xl font-extrabold text-slate-950">
                    Registrasi Akun Tenaga Medis
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Pengajuan akun baru berstatus <strong>Medical Student</strong> dan memerlukan
                    persetujuan (ACC) jajaran petinggi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Nama Lengkap (IC) <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNamaIc}
                    onChange={(e) => setRegNamaIc(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda (tanpa gelar)"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Email Dinas <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@rskotabaru.id"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Discord User ID (Auto-Tag) <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regDiscordId}
                      onChange={(e) => setRegDiscordId(e.target.value)}
                      placeholder="704829104829104899"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Username Discord (Audit OOC) <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regDiscordUser}
                      onChange={(e) => setRegDiscordUser(e.target.value)}
                      placeholder="araki.ise"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                {/* Kolom Password & Confirm Password */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Password <span className="text-red-700">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Buat password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs text-slate-900 focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Toggle password"
                      >
                        {showRegPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Confirm Password <span className="text-red-700">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs text-slate-900 focus:border-[#8B1515] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Toggle confirm password"
                      >
                        {showRegConfirmPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validasi Keamanan Password Real-time */}
                <div className="rounded-2xl border border-red-100/90 bg-red-50/35 p-3.5">
                  <p className="text-[11px] font-extrabold text-slate-900">
                    Validasi Keamanan Password Real-time:
                  </p>
                  <div className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-2">
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasUppercase ? 'font-semibold text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {hasUppercase ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-slate-400" />
                      )}
                      <span>Minimal 1 huruf besar (Uppercase)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        hasLowercase ? 'font-semibold text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {hasLowercase ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-slate-400" />
                      )}
                      <span>Minimal 1 huruf kecil (Lowercase)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        hasNumber ? 'font-semibold text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {hasNumber ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-slate-400" />
                      )}
                      <span>Minimal 1 angka (Number)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        hasSymbol ? 'font-semibold text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {hasSymbol ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-slate-400" />
                      )}
                      <span>Minimal 1 simbol (!@#$%^&*)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 sm:col-span-2 ${
                        isPasswordMatch ? 'font-semibold text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {isPasswordMatch ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-slate-400" />
                      )}
                      <span>Konfirmasi password cocok</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B1515] py-3 text-xs font-bold text-white shadow-md shadow-red-900/15 transition hover:bg-[#6D0E0E]"
                >
                  <UserCheck className="h-4 w-4" />
                  Ajukan Akun Staff (Butuh ACC Petinggi)
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;