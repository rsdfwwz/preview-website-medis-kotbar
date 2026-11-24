import React, { createContext, useContext, useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  INITIAL_ANOMALY_ALERTS,
  INITIAL_CERTIFICATES,
  INITIAL_COMPLAINTS,
  INITIAL_DUTY_LOGS,
  INITIAL_NAME_REQUESTS,
  INITIAL_RECRUITMENTS,
  INITIAL_STAFF,
  INITIAL_SUBMISSIONS,
  MEDICAL_REGULATIONS,
  PHARMACY_PACKAGES,
  type MedicalRegulationItem,
  type PharmacyPackage,
} from '@/data/mockData';
import type {
  AnomalyAlert,
  CitizenComplaint,
  DutyLog,
  NameChangeRequest,
  OfficialCertificate,
  RecruitmentApplication,
  RoleName,
  ServiceSubmission,
  StaffProfile,
} from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';

interface RegisterStaffInput {
  namaIc: string;
  nip: string;
  email: string;
  discordId: string;
  discordUsername: string;
  role: RoleName;
  divisi: StaffProfile['divisi'];
}

interface PortalContextValue {
  currentUser: StaffProfile | null;
  staffList: StaffProfile[];
  dutyLogs: DutyLog[];
  lastDiscordSync: string;
  discordWebhookNotifications: string[];
  pharmacyPackages: PharmacyPackage[];
  regulations: MedicalRegulationItem[];
  submissions: ServiceSubmission[];
  certificates: OfficialCertificate[];
  complaints: CitizenComplaint[];
  recruitments: RecruitmentApplication[];
  nameRequests: NameChangeRequest[];
  anomalyAlerts: AnomalyAlert[];
  loginStaff: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginDemoAs: (staffUid: string) => void;
  registerStaffAccount: (data: RegisterStaffInput) => { ok: boolean; message: string };
  approveStaffAccount: (staffUid: string) => void;
  updateStaffRole: (staffUid: string, newRole: RoleName, spesialisasi?: string) => void;
  logoutStaff: () => Promise<void>;
  syncDiscordLogs: () => void;
  submitCitizenService: (
    data: Omit<ServiceSubmission, 'id' | 'kodeTiket' | 'status' | 'dibuatPada'>
  ) => ServiceSubmission;
  updateSubmissionStatus: (
    submissionId: string,
    status: ServiceSubmission['status']
  ) => void;
  issueCertificate: (
    data: Omit<
      OfficialCertificate,
      'noSurat' | 'penerbitFormatted' | 'penerbitRole' | 'penerbitNip' | 'tanggalTerbit' | 'statusValiditas'
    >
  ) => OfficialCertificate | null;
  submitComplaint: (
    data: Omit<CitizenComplaint, 'id' | 'tanggalKirim' | 'status'>
  ) => void;
  submitRecruitment: (
    data: Omit<RecruitmentApplication, 'id' | 'tanggalDaftar' | 'status'>
  ) => void;
  updateRecruitmentStatus: (id: string, status: RecruitmentApplication['status']) => void;
  requestNameChange: (namaBaru: string, alasan: string) => { ok: boolean; message: string };
  processNameChangeRequest: (requestId: string, approve: boolean) => void;
  resolveAnomalyAlert: (alertId: string) => void;
}

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<StaffProfile | null>(null);
  const [staffList, setStaffList] = useState<StaffProfile[]>(INITIAL_STAFF);
  const [dutyLogs] = useState<DutyLog[]>(INITIAL_DUTY_LOGS);
  const [lastDiscordSync, setLastDiscordSync] = useState<string>('2026-11-22 14:00 WIB');
  const [discordWebhookNotifications, setDiscordWebhookNotifications] = useState<string[]>([
    '[BOT RS-KBR] Sistem Webhook & Queue Auto-Tag Discord aktif.',
  ]);
  const [pharmacyPackages] = useState<PharmacyPackage[]>(PHARMACY_PACKAGES);
  const [regulations] = useState<MedicalRegulationItem[]>(MEDICAL_REGULATIONS);
  const [submissions, setSubmissions] = useState<ServiceSubmission[]>(INITIAL_SUBMISSIONS);
  const [certificates, setCertificates] = useState<OfficialCertificate[]>(INITIAL_CERTIFICATES);
  const [complaints, setComplaints] = useState<CitizenComplaint[]>(INITIAL_COMPLAINTS);
  const [recruitments, setRecruitments] = useState<RecruitmentApplication[]>(INITIAL_RECRUITMENTS);
  const [nameRequests, setNameRequests] = useState<NameChangeRequest[]>(INITIAL_NAME_REQUESTS);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>(INITIAL_ANOMALY_ALERTS);

  const loginStaff = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch {
        return {
          ok: false,
          error: 'Email atau kata sandi tidak cocok dengan akun Firebase.',
        };
      }
    }

    const matchedStaff = staffList.find((s) => s.email.toLowerCase() === cleanEmail);
    if (!matchedStaff) {
      return {
        ok: false,
        error: 'Akun email tidak terdaftar di database personel RS Kota Baru.',
      };
    }

    if (matchedStaff.statusAkun === 'pending_acc') {
      return {
        ok: false,
        error: 'Akun Anda masih menunggu persetujuan (ACC) dari Petinggi / HRD RS Kota Baru.',
      };
    }

    setCurrentUser(matchedStaff);
    return { ok: true };
  };

  const loginDemoAs = (staffUid: string) => {
    const target = staffList.find((s) => s.uid === staffUid && s.statusAkun === 'aktif');
    if (target) {
      setCurrentUser(target);
    }
  };

  const registerStaffAccount = (data: RegisterStaffInput) => {
    const exists = staffList.some(
      (s) => s.email.toLowerCase() === data.email.trim().toLowerCase() || s.nip === data.nip.trim()
    );
    if (exists) {
      return { ok: false, message: 'Email atau NIP sudah terdaftar dalam sistem.' };
    }

    const newStaff: StaffProfile = {
      uid: `staff-${Date.now()}`,
      email: data.email.trim().toLowerCase(),
      namaIc: data.namaIc.trim(),
      nip: data.nip.trim(),
      discordId: data.discordId.trim(),
      discordUsername: data.discordUsername.trim(),
      role: data.role,
      divisi: data.divisi,
      jadwalShift: 'Shift 1 (08:00 - 16:00)',
      statusDuty: 'off_duty',
      menitDutyHarian: 0,
      menitDutyMingguan: 0,
      menitDutyBulanan: 0,
      totalMenitDuty: 0,
      tarifPerJam: 6500,
      nomorRekening: `KBR-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      statusAkun: 'pending_acc',
      bergabungPada: new Date().toISOString().slice(0, 10),
    };

    setStaffList((prev) => [newStaff, ...prev]);
    return {
      ok: true,
      message: 'Pendaftaran akun berhasil dikirim! Menunggu persetujuan (ACC) Petinggi / HRD.',
    };
  };

  const approveStaffAccount = (staffUid: string) => {
    setStaffList((prev) =>
      prev.map((s) => (s.uid === staffUid ? { ...s, statusAkun: 'aktif' } : s))
    );
  };

  const updateStaffRole = (staffUid: string, newRole: RoleName, spesialisasi?: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.uid !== staffUid) return s;
        const updated: StaffProfile = {
          ...s,
          role: newRole,
          spesialisasi: spesialisasi !== undefined ? spesialisasi : s.spesialisasi,
          memilikiGelarDokter:
            newRole === 'Doctor' || newRole === 'Doctor Specialist' ? true : s.memilikiGelarDokter,
        };
        if (currentUser?.uid === staffUid) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
  };

  const logoutStaff = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch {
        // Abaikan error jaringan
      }
    }
    setCurrentUser(null);
  };

  const syncDiscordLogs = () => {
    const now = new Date();
    const formatted = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)} WIB`;
    setLastDiscordSync(formatted);
    setStaffList((prev) => [...prev]);
  };

  const submitCitizenService = (
    data: Omit<ServiceSubmission, 'id' | 'kodeTiket' | 'status' | 'dibuatPada'>
  ): ServiceSubmission => {
    const now = new Date();
    const kodeTiket = `KBR-TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSub: ServiceSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      kodeTiket,
      status: 'menunggu',
      dibuatPada: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
    };

    setSubmissions((prev) => [newSub, ...prev]);

    // Auto-Tag Dokter/Staf ke Discord jika memilih dokter tujuan pada Janji Temu
    if (data.dokterTujuanUid) {
      const targetDoc = staffList.find((s) => s.uid === data.dokterTujuanUid);
      if (targetDoc) {
        const docName = formatStaffDisplayName(targetDoc);
        setDiscordWebhookNotifications((prev) => [
          `[AUTO-TAG DISCORD] <@${targetDoc.discordId}> (${docName}) ditandai untuk ${data.jenisLayanan} oleh warga ${data.namaWarga} (${kodeTiket}).`,
          ...prev,
        ]);
      }
    } else {
      setDiscordWebhookNotifications((prev) => [
        `[WEBHOOK DISCORD] Tiket baru ${kodeTiket} (${data.jenisLayanan}) dari ${data.namaWarga} masuk ke antrean loket.`,
        ...prev,
      ]);
    }

    return newSub;
  };

  const updateSubmissionStatus = (
    submissionId: string,
    status: ServiceSubmission['status']
  ) => {
    if (!currentUser) return;
    const handlerName = formatStaffDisplayName(currentUser);

    // Detektor Anomali Anti-Abuse jika staf memproses tiket saat Off-Duty di Discord
    if (currentUser.statusDuty === 'off_duty') {
      const targetSub = submissions.find((s) => s.id === submissionId);
      setAnomalyAlerts((prev) => [
        {
          id: `anom-${Date.now()}`,
          staffUid: currentUser.uid,
          namaStaffFormatted: handlerName,
          nip: currentUser.nip,
          discordUsername: currentUser.discordUsername,
          jenisPelanggaran: 'Buat Tagihan/Surat Saat Off-Duty',
          detailAktivitas: `Memproses tiket ${targetSub?.kodeTiket || submissionId} saat status Discord OFF DUTY.`,
          waktuKejadian: new Date().toISOString().slice(0, 16).replace('T', ' '),
          statusAudit: 'perlu_tinjauan',
        },
        ...prev,
      ]);
    }

    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId
          ? { ...sub, status, ditanganiOlehFormatted: handlerName }
          : sub
      )
    );
  };

  const issueCertificate = (
    data: Omit<
      OfficialCertificate,
      'noSurat' | 'penerbitFormatted' | 'penerbitRole' | 'penerbitNip' | 'tanggalTerbit' | 'statusValiditas'
    >
  ): OfficialCertificate | null => {
    if (!currentUser) return null;

    const prefixMap: Record<OfficialCertificate['jenisSurat'], string> = {
      'Surat Keterangan Sehat (SKS)': 'SKS',
      'Surat Hasil Tes Psikologi': 'PSI',
      'Sertifikat Kematian (CK)': 'CK',
      'MoU Instansi': 'MOU',
    };

    const prefix = prefixMap[data.jenisSurat];
    const noSurat = `${prefix}-KBR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const penerbitFormatted = formatStaffDisplayName(currentUser);

    // Detektor Anomali jika menerbitkan surat resmi saat status Discord Off-Duty
    if (currentUser.statusDuty === 'off_duty') {
      setAnomalyAlerts((prev) => [
        {
          id: `anom-${Date.now()}`,
          staffUid: currentUser.uid,
          namaStaffFormatted: penerbitFormatted,
          nip: currentUser.nip,
          discordUsername: currentUser.discordUsername,
          jenisPelanggaran: 'Buat Tagihan/Surat Saat Off-Duty',
          detailAktivitas: `Menerbitkan ${data.jenisSurat} (${noSurat}) atas nama ${data.namaPenerima} saat status Discord OFF DUTY.`,
          waktuKejadian: new Date().toISOString().slice(0, 16).replace('T', ' '),
          statusAudit: 'perlu_tinjauan',
        },
        ...prev,
      ]);
    }

    const newCert: OfficialCertificate = {
      ...data,
      noSurat,
      penerbitFormatted,
      penerbitRole: currentUser.role,
      penerbitNip: currentUser.nip,
      tanggalTerbit: new Date().toISOString().slice(0, 10),
      statusValiditas: 'SAH / VALID',
    };

    setCertificates((prev) => [newCert, ...prev]);
    return newCert;
  };

  const submitComplaint = (
    data: Omit<CitizenComplaint, 'id' | 'tanggalKirim' | 'status'>
  ) => {
    const newItem: CitizenComplaint = {
      ...data,
      id: `cmp-${Date.now()}`,
      namaPelapor: data.anonim ? 'Anonim' : data.namaPelapor.trim() || 'Warga Kota Baru',
      tanggalKirim: new Date().toISOString().slice(0, 10),
      status: 'baru',
    };
    setComplaints((prev) => [newItem, ...prev]);
  };

  const submitRecruitment = (
    data: Omit<RecruitmentApplication, 'id' | 'tanggalDaftar' | 'status'>
  ) => {
    const newApp: RecruitmentApplication = {
      ...data,
      id: `rec-${Date.now()}`,
      tanggalDaftar: new Date().toISOString().slice(0, 10),
      status: 'seleksi',
    };
    setRecruitments((prev) => [newApp, ...prev]);
  };

  const updateRecruitmentStatus = (id: string, status: RecruitmentApplication['status']) => {
    setRecruitments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const requestNameChange = (namaBaru: string, alasan: string) => {
    if (!currentUser) {
      return { ok: false, message: 'Anda harus login terlebih dahulu.' };
    }
    const cleanNew = namaBaru.trim();
    if (!cleanNew || cleanNew === currentUser.namaIc) {
      return { ok: false, message: 'Nama IC baru tidak boleh kosong atau sama dengan nama lama.' };
    }

    const newReq: NameChangeRequest = {
      id: `ncr-${Date.now()}`,
      staffUid: currentUser.uid,
      nip: currentUser.nip,
      namaLama: currentUser.namaIc,
      namaBaru: cleanNew,
      alasan: alasan.trim() || 'Perubahan Identitas Warga Kota',
      diajukanPada: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'pending',
    };

    setNameRequests((prev) => [newReq, ...prev]);
    return {
      ok: true,
      message: 'Pengajuan perubahan nama IC telah dikirim ke Petinggi untuk ditinjau (ACC).',
    };
  };

  const processNameChangeRequest = (requestId: string, approve: boolean) => {
    if (!currentUser) return;
    const approverName = formatStaffDisplayName(currentUser);
    const targetReq = nameRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    setNameRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: approve ? 'disetujui' : 'ditolak',
              diprosesOleh: approverName,
            }
          : r
      )
    );

    if (approve) {
      setStaffList((prev) =>
        prev.map((s) => {
          if (s.uid !== targetReq.staffUid) return s;
          const updated = { ...s, namaIc: targetReq.namaBaru };
          if (currentUser.uid === s.uid) {
            setCurrentUser(updated);
          }
          return updated;
        })
      );
    }
  };

  const resolveAnomalyAlert = (alertId: string) => {
    setAnomalyAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, statusAudit: 'selesai_ditindak' } : a))
    );
  };

  return (
    <PortalContext.Provider
      value={{
        currentUser,
        staffList,
        dutyLogs,
        lastDiscordSync,
        discordWebhookNotifications,
        pharmacyPackages,
        regulations,
        submissions,
        certificates,
        complaints,
        recruitments,
        nameRequests,
        anomalyAlerts,
        loginStaff,
        loginDemoAs,
        registerStaffAccount,
        approveStaffAccount,
        updateStaffRole,
        logoutStaff,
        syncDiscordLogs,
        submitCitizenService,
        updateSubmissionStatus,
        issueCertificate,
        submitComplaint,
        submitRecruitment,
        updateRecruitmentStatus,
        requestNameChange,
        processNameChangeRequest,
        resolveAnomalyAlert,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal harus dipanggil di dalam <PortalProvider>');
  }
  return ctx;
}