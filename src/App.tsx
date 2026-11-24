import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PortalProvider } from '@/context/PortalContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/public/HomePage';
import { ServicesPage } from '@/pages/public/ServicesPage';
import { SubmissionsHistoryPage } from '@/pages/public/SubmissionsHistoryPage';
import { TestResultsPage } from '@/pages/public/TestResultsPage';
import { DoctorsSchedulePage } from '@/pages/public/DoctorsSchedulePage';
import { RegulationsPage } from '@/pages/public/RegulationsPage';
import { ComplaintsPage } from '@/pages/public/ComplaintsPage';
import { VerifyCertificatePage } from '@/pages/public/VerifyCertificatePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

function AppShell() {
  const location = useLocation();
  const isStaffWorkspace =
    location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/login');

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      {!isStaffWorkspace && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/layanan" element={<ServicesPage />} />
          <Route path="/riwayat-pengajuan" element={<SubmissionsHistoryPage />} />
          <Route path="/hasil-tes" element={<TestResultsPage />} />
          <Route path="/jadwal-dokter" element={<DoctorsSchedulePage />} />
          <Route path="/regulasi" element={<RegulationsPage />} />
          <Route path="/keluhan" element={<ComplaintsPage />} />
          <Route path="/verify" element={<VerifyCertificatePage />} />
          <Route path="/verify/:noSurat" element={<VerifyCertificatePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isStaffWorkspace && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <PortalProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </PortalProvider>
  );
}

export default App;