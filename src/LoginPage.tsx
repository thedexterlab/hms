import { HospitalLogo } from './components/common/HospitalLogo';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LockKeyhole, ShieldCheck, Stethoscope } from 'lucide-react';
import { LoginForm } from './LoginForm';

const highlights = [
  'Secure role-based access',
  'Protected patient information',
  'Complete hospital operations',
  'Activity and audit monitoring',
];

export function LoginPage() {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');

  return (
    <main className="min-h-screen bg-[#f3f8fb] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1440px] p-0 sm:p-4 lg:p-6">
        <div className="flex w-full flex-col overflow-hidden border-slate-200 bg-white shadow-xl sm:rounded-[28px] sm:border lg:flex-row">
          <section className="relative flex min-h-[250px] flex-1 flex-col justify-between overflow-hidden bg-[#073b4c] p-6 text-white sm:p-8 lg:min-h-[calc(100vh-3rem)] lg:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-200/15" aria-hidden="true" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-cyan-200/10" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <HospitalLogo className="h-20 w-20 rounded-2xl p-2" />
                <div>
                  <p className="text-xl font-bold tracking-tight">Mastan Hospital</p>
                  <p className="text-sm text-cyan-100">Hospital Management System</p>
                </div>
              </div>

              <div className="mt-10 max-w-xl lg:mt-24">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Khokhrapar, Malir, Karachi</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Care coordination, made secure.</h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-200 sm:text-base">
                  Securely manage hospital operations, patient care, departments, staff, pharmacy, finance, and medical records.
                </p>
              </div>

              <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2 lg:mt-12">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-slate-100">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 hidden items-center gap-3 border-t border-white/15 pt-6 lg:flex">
              <Stethoscope className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="text-sm text-slate-200">Trusted digital care coordination for authorized hospital personnel.</p>
            </div>
          </section>

          <section className="flex w-full items-center justify-center bg-[#f8fbfd] p-5 sm:p-8 lg:w-[500px] lg:shrink-0 lg:p-10">
            <div className="w-full max-w-[440px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <HospitalLogo className="mx-auto mb-6 h-28 w-28" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">Staff access portal</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
                  </div>
                  <LockKeyhole className="mt-1 h-5 w-5 text-teal-700" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">Enter your credentials to access the hospital management system.</p>

                <div className="mt-6" aria-live="polite">
                  <LoginForm onSuccess={() => navigate('/dashboard')} onStatusChange={setSystemStatus} />
                </div>

                <div className="mt-7 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-500">
                  <p className="font-medium text-slate-600">Authorized hospital personnel only.</p>
                  <p>By signing in, you agree to follow Mastan Hospital’s privacy, confidentiality, and acceptable-use policies.</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" aria-hidden="true" />© 2026 Mastan Hospital.</span>
                  <span className="flex items-center gap-2" role="status">
                    <span className={`h-2 w-2 rounded-full ${systemStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden="true" />
                    {systemStatus === 'online' ? 'System online' : 'Server unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
