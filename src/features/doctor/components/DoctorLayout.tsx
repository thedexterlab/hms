import { HospitalLogo } from '../../../components/common/HospitalLogo';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bell, CalendarDays, FileText, LogOut, Pill, Settings, Stethoscope, UserRound, Users, ListOrdered } from 'lucide-react';
import { clearCurrentSession, getCurrentSession } from '../../../auth.service';

const links = [
  ['/doctor/dashboard', 'Dashboard', Activity], ['/doctor/queue', 'OPD queue', ListOrdered], ['/doctor/patients', 'My patients', Users], ['/doctor/appointments', 'Appointments', CalendarDays],
  ['/doctor/consultation', 'Consultation room', Stethoscope], ['/doctor/records', 'Medical records', FileText], ['/doctor/prescriptions', 'Prescriptions', Pill],
  ['/doctor/reports', 'Reports', FileText], ['/doctor/notifications', 'Notifications', Bell],
  ['/doctor/gynae-cycle', 'Gynae cycle', CalendarDays],
];

export function DoctorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getCurrentSession();
  const logout = () => { clearCurrentSession(); navigate('/login', { replace: true }); };
  return <div className="min-h-screen bg-[#f4f8fb] text-slate-800">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#073b4c] px-4 py-5 text-white lg:flex">
      <Link to="/doctor/dashboard" className="flex items-center gap-3 border-b border-white/10 px-1 pb-5"><HospitalLogo /><div><p className="font-bold">Mastan Hospital</p><p className="text-xs text-cyan-100">Doctor workspace</p></div></Link>
      <div className="mt-7 rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase tracking-wider text-cyan-200">Clinical workspace</p><p className="mt-1 font-semibold">OPD Doctor</p><p className="mt-1 text-xs text-slate-300">Outpatient Department</p></div>
      <nav className="mt-7 flex-1 space-y-2" aria-label="Doctor navigation">{links.map(([to, label, Icon]) => <Link key={String(to)} to={String(to)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${location.pathname === to ? 'bg-cyan-400/15 font-semibold text-cyan-100' : 'text-slate-300 hover:bg-white/10'}`}><Icon className="h-5 w-5" />{label}</Link>)}</nav>
      <div className="border-t border-white/10 pt-4"><Link to="/doctor/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><UserRound className="h-5 w-5" />My profile</Link><Link to="/doctor/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><Settings className="h-5 w-5" />Settings</Link><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10"><LogOut className="h-5 w-5" />Sign out</button></div>
    </aside>
    <div className="lg:pl-64"><header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div className="flex min-w-0 items-center gap-3"><HospitalLogo className="h-12 w-12" /><div><p className="text-sm text-slate-500">Mastan Hospital · OPD</p><h1 className="text-xl font-bold text-slate-900">{links.find(([to]) => to === location.pathname)?.[1] ?? 'Doctor workspace'}</h1></div></div><div className="flex items-center gap-3"><Bell className="h-5 w-5 text-slate-500" /><div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">DR</div><div className="hidden sm:block"><p className="text-sm font-semibold text-slate-900">{session?.user.fullName ?? 'Doctor'}</p><p className="text-xs text-slate-500">Outpatient Department</p></div></div></header><main className="mx-auto max-w-7xl p-5 sm:p-8"><Outlet /></main></div>
  </div>;
}
