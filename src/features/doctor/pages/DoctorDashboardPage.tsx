import { HospitalLogo } from '../../../components/common/HospitalLogo';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Bell, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Clock3, FileText, LogOut, Menu, Search, Settings, Stethoscope, Users, X, Pill, ListOrdered } from 'lucide-react';
import { clearCurrentSession, getCurrentSession } from '../../../auth.service';

const appointments = [
  { time: '09:00 AM', patient: 'Ayesha Khan', mrn: 'MH-240318', type: 'Follow-up', status: 'Ready', tone: 'emerald' },
  { time: '09:30 AM', patient: 'Muhammad Hamza', mrn: 'MH-240321', type: 'New consultation', status: 'Waiting', tone: 'amber' },
  { time: '10:00 AM', patient: 'Sana Iqbal', mrn: 'MH-240327', type: 'Follow-up', status: 'Scheduled', tone: 'blue' },
  { time: '10:30 AM', patient: 'Bilal Ahmed', mrn: 'MH-240329', type: 'New consultation', status: 'Scheduled', tone: 'blue' },
];
const opdAppointments = appointments;

const statusStyles = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-sky-50 text-sky-700',
};

export function DoctorDashboardPage() {
  const navigate = useNavigate();
  const session = getCurrentSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    clearCurrentSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#073b4c] px-4 py-5 text-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-1 pb-5">
          <HospitalLogo />
          <div><p className="font-bold">Mastan Hospital</p><p className="text-xs text-cyan-100">Doctor workspace</p></div>
          <button type="button" onClick={() => setMenuOpen(false)} className="ml-auto lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-7 rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase tracking-wider text-cyan-200">Clinical workspace</p><p className="mt-1 font-semibold">{session?.user.specialty ?? 'OPD Doctor'}</p><p className="mt-1 text-xs text-slate-300">{session?.user.departmentName ?? 'Outpatient Department'}</p></div>
        <nav className="mt-7 space-y-2" aria-label="Doctor navigation">
          <Link to="/doctor/dashboard" className="flex items-center gap-3 rounded-xl bg-cyan-400/15 px-4 py-3 text-sm font-semibold text-cyan-100"><Activity className="h-5 w-5" />Dashboard</Link>
          <Link to="/doctor/queue" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><ListOrdered className="h-5 w-5" />OPD queue</Link>
          <Link to="/doctor/patients" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><Users className="h-5 w-5" />My patients</Link>
          <Link to="/doctor/appointments" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><CalendarDays className="h-5 w-5" />Appointments</Link>
          <Link to="/doctor/consultation" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><Stethoscope className="h-5 w-5" />Consultation room</Link>
          <Link to="/doctor/records" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><FileText className="h-5 w-5" />Medical records</Link>
          <Link to="/doctor/prescriptions" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><Pill className="h-5 w-5" />Prescriptions</Link>
          <Link to="/doctor/reports" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><FileText className="h-5 w-5" />Reports</Link>
          <Link to="/doctor/notifications" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><Bell className="h-5 w-5" />Notifications</Link>
        </nav>
        <div className="mt-auto space-y-2 border-t border-white/10 pt-5"><Link to="/doctor/settings" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"><Settings className="h-5 w-5" />Settings</Link><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10"><LogOut className="h-5 w-5" />Sign out</button></div>
      </aside>
      {menuOpen ? <button type="button" aria-label="Close navigation overlay" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" /> : null}

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button><HospitalLogo className="h-12 w-12" /><div><p className="text-sm text-slate-500">Wednesday, 18 June 2026</p><h1 className="text-xl font-bold text-slate-900">Doctor dashboard</h1></div></div>
          <div className="flex items-center gap-4"><Link to="/doctor/notifications" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" /></Link><Link to="/doctor/profile" className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700">DR</div><div><p className="text-sm font-semibold text-slate-900">{session?.user.fullName ?? 'Doctor'}</p><p className="text-xs text-slate-500">{session?.user.specialty ?? 'OPD Doctor'}</p></div></Link></div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          <section className="rounded-2xl bg-gradient-to-r from-[#0b7180] to-[#0b5669] p-6 text-white shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-sm text-cyan-100">Good morning, Doctor</p><h2 className="mt-1 text-2xl font-bold">Ready to make a difference today?</h2><p className="mt-2 max-w-xl text-sm text-cyan-50">Review your {session?.user.specialty ?? 'OPD'} schedule, manage patient consultations, and keep every record up to date.</p></div><div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"><Stethoscope className="h-6 w-6 text-cyan-100" /><div><p className="text-xs text-cyan-100">Department</p><p className="font-semibold">{session?.user.departmentName ?? 'Outpatient Department'}</p></div></div></div></section>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
            ['Today’s appointments', '18', CalendarDays, '4 remaining'], ['Waiting patients', '06', Clock3, '2 urgent'], ['Completed today', '12', CheckCircle2, '67% of schedule'], ['Total patients', '1,284', Users, 'This month'],
          ].map(([label, value, Icon, detail]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div><div className="rounded-xl bg-teal-50 p-3 text-teal-700"><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-xs font-medium text-slate-500">{detail}</p></div>)}</section>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Today’s OPD schedule</h2><p className="mt-1 text-sm text-slate-500">Your upcoming consultations</p></div><Link to="/doctor/appointments" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Search appointments"><Search className="h-5 w-5" /></Link></div><div className="divide-y divide-slate-100">{appointments.map((appointment) => <Link to={`/doctor/patients/${appointment.mrn}`} key={appointment.mrn} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50"><div className="w-20 text-sm font-semibold text-slate-700">{appointment.time}</div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">{appointment.patient.split(' ').map((name) => name[0]).join('')}</div><div className="min-w-[150px] flex-1"><p className="font-semibold text-slate-900">{appointment.patient}</p><p className="text-xs text-slate-500">{appointment.mrn} · {appointment.type}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.tone as keyof typeof statusStyles]}`}>{appointment.status}</span><ChevronRight className="h-5 w-5 text-slate-400" /></Link>)}</div><div className="border-t border-slate-100 p-4 text-center"><Link to="/doctor/appointments" className="text-sm font-semibold text-teal-700 hover:text-teal-800">View full schedule</Link></div></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Quick actions</h2><p className="mt-1 text-sm text-slate-500">Common clinical tasks</p></div><ClipboardList className="h-5 w-5 text-teal-700" /></div><div className="mt-5 space-y-3">{[['Start consultation', 'Open the next patient visit', Users, '/doctor/consultation'], ['Patient records', 'Search and review medical history', FileText, '/doctor/records'], ['My appointments', 'Review your complete schedule', CalendarDays, '/doctor/appointments']].map(([title, detail, Icon, to]) => <Link to={String(to)} key={String(title)} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50"><div className="rounded-lg bg-teal-50 p-2.5 text-teal-700"><Icon className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-semibold text-slate-900">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><ChevronRight className="h-4 w-4 text-slate-400" /></Link>)}</div></section>
          </div>
        </main>
      </div>
    </div>
  );
}
