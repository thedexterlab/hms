import { HospitalLogo } from './components/common/HospitalLogo';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RoleRedirect } from './RoleRedirect';
import { ReceptionLayout } from './layouts/ReceptionLayout';
import { ReceptionDashboardPage } from './features/reception/pages/ReceptionDashboardPage';
import { PatientSearchPage } from './features/reception/pages/PatientSearchPage';
import { NewPatientPage } from './features/reception/pages/NewPatientPage';
import { WalkInPage } from './features/reception/pages/WalkInPage';
import { PatientProfilePage } from './features/reception/pages/PatientProfilePage';
import { AppointmentPage } from './features/reception/pages/AppointmentPage';
import { QueuePage } from './features/reception/pages/QueuePage';
import { PrintCenterPage } from './features/reception/pages/PrintCenterPage';
import { ActivityPage } from './features/reception/pages/ActivityPage';
import { NotificationsPage } from './features/reception/pages/NotificationsPage';
import { ProfilePage } from './features/reception/pages/ProfilePage';
import { queryClient } from './lib/queryClient';
import { DoctorDashboardPage } from './features/doctor/pages/DoctorDashboardPage';
import { DoctorLayout } from './features/doctor/components/DoctorLayout';
import { DoctorWorkspacePage } from './features/doctor/pages/DoctorWorkspacePage';
import { DoctorPatientDetailPage } from './features/doctor/pages/DoctorPatientDetailPage';
import { DoctorQueuePage } from './features/doctor/pages/DoctorQueuePage';
import { DoctorConsultationPage } from './features/doctor/pages/DoctorConsultationPage';
import { GynaeCyclePage } from './features/doctor/pages/GynaeCyclePage';
import { PediatricDashboardPage } from './features/doctor/pages/PediatricDashboardPage';
import { PharmacyDashboardPage } from './features/pharmacy/pages/PharmacyDashboardPage';
import './styles/print.css';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-slate-700"><div><HospitalLogo className="mx-auto mb-4 h-24 w-24" /><p>Forgot password is not available yet.</p></div></div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<RoleRedirect />} />
            <Route path="/admin/dashboard" element={<div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-slate-700"><div><HospitalLogo className="mx-auto mb-4 h-24 w-24" /><p>Administrator dashboard placeholder.</p></div></div>} />
            <Route path="/reception" element={<Navigate to="/reception/dashboard" replace />} />
            <Route element={<ReceptionLayout />}>
              <Route path="/reception/dashboard" element={<ReceptionDashboardPage />} />
              <Route path="/reception/patients" element={<PatientSearchPage />} />
              <Route path="/reception/patients/new" element={<NewPatientPage />} />
              <Route path="/reception/patients/:patientId" element={<PatientProfilePage />} />
              <Route path="/reception/patients/:patientId/edit" element={<NewPatientPage />} />
              <Route path="/reception/appointments" element={<AppointmentPage />} />
              <Route path="/reception/appointments/new" element={<AppointmentPage />} />
              <Route path="/reception/appointments/:appointmentId" element={<AppointmentPage />} />
              <Route path="/reception/queue" element={<QueuePage />} />
              <Route path="/reception/walk-ins/new" element={<WalkInPage />} />
              <Route path="/reception/print-center" element={<PrintCenterPage />} />
              <Route path="/reception/activity" element={<ActivityPage />} />
              <Route path="/reception/notifications" element={<NotificationsPage />} />
              <Route path="/reception/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
            <Route element={<DoctorLayout />}>
              <Route path="/doctor/patients" element={<DoctorWorkspacePage kind="patients" />} />
              <Route path="/doctor/queue" element={<DoctorQueuePage />} />
              <Route path="/doctor/gynae-cycle" element={<GynaeCyclePage />} />
              <Route path="/doctor/pediatrics" element={<PediatricDashboardPage />} />
              <Route path="/doctor/patients/:patientId/gynae-cycle" element={<GynaeCyclePage />} />
              <Route path="/doctor/patients/:patientId" element={<DoctorPatientDetailPage />} />
              <Route path="/doctor/appointments" element={<DoctorWorkspacePage kind="appointments" />} />
              <Route path="/doctor/consultation" element={<DoctorConsultationPage />} />
              <Route path="/doctor/records" element={<DoctorWorkspacePage kind="records" />} />
              <Route path="/doctor/prescriptions" element={<DoctorWorkspacePage kind="prescriptions" />} />
              <Route path="/doctor/reports" element={<DoctorWorkspacePage kind="reports" />} />
              <Route path="/doctor/notifications" element={<DoctorWorkspacePage kind="notifications" />} />
              <Route path="/doctor/profile" element={<DoctorWorkspacePage kind="profile" />} />
              <Route path="/doctor/settings" element={<DoctorWorkspacePage kind="settings" />} />
            </Route>
            <Route path="/pharmacy/dashboard" element={<PharmacyDashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
