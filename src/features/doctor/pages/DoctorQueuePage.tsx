import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, PlayCircle, UserRound, Users } from 'lucide-react';
import { readDoctorData, writeDoctorData } from '../services/doctorStorage';

const queue = [
  { token: 'OPD-018', name: 'Muhammad Hamza', mrn: 'MH-240321', arrival: '09:12 AM', wait: '18 min', priority: 'Urgent', status: 'Waiting' },
  { token: 'OPD-019', name: 'Sana Iqbal', mrn: 'MH-240327', arrival: '09:24 AM', wait: '06 min', priority: 'Normal', status: 'Waiting' },
  { token: 'OPD-020', name: 'Bilal Ahmed', mrn: 'MH-240329', arrival: '09:31 AM', wait: '02 min', priority: 'Normal', status: 'Waiting' },
  { token: 'OPD-017', name: 'Ayesha Khan', mrn: 'MH-240318', arrival: '08:55 AM', wait: 'In consultation', priority: 'Normal', status: 'In consultation' },
];

export function DoctorQueuePage() {
  const [started, setStarted] = useState<string[]>(() => readDoctorData('started-consultations', []));
  const startConsultation = (mrn: string) => { const next = [...new Set([...started, mrn])]; setStarted(next); writeDoctorData('started-consultations', next); };
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-teal-700">OPD clinical workspace</p><h2 className="mt-1 text-3xl font-bold text-slate-900">OPD queue</h2><p className="mt-2 text-sm text-slate-500">Patients waiting for your outpatient consultation.</p></div><div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800"><Users className="h-5 w-5" />3 waiting</div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Waiting patients" value="03" tone="amber" /><Metric label="In consultation" value="01" tone="blue" /><Metric label="Average wait" value="09 min" tone="teal" /></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">Today’s OPD queue</h3><p className="mt-1 text-sm text-slate-500">Updated just now</p></div><span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live queue</span></div><div className="divide-y divide-slate-100">{queue.map((item) => <div key={item.token} className="flex flex-wrap items-center gap-4 p-5 hover:bg-slate-50"><div className="flex h-11 w-14 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700">{item.token}</div><Link to={`/doctor/patients/${item.mrn}`} className="flex min-w-[190px] flex-1 items-center gap-3 rounded-xl p-1 hover:bg-teal-50"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.mrn} · Arrived {item.arrival}</p></div></Link><div className="flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4" />{item.wait}</div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.priority === 'Urgent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{item.priority}</span>{item.status === 'In consultation' || started.includes(item.mrn) ? <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">In consultation</span> : <button type="button" onClick={() => startConsultation(item.mrn)} className="flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"><PlayCircle className="h-4 w-4" />Start consultation</button>}</div>)}</div></section>
  </div>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'blue' | 'teal' }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${tone === 'amber' ? 'text-amber-600' : tone === 'blue' ? 'text-sky-700' : 'text-teal-700'}`}>{value}</p></div>; }
