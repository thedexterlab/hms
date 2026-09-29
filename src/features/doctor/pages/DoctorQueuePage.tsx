import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, PlayCircle, UserRound, Users } from 'lucide-react';
import { getCurrentSession, isMockAuthEnabled } from '../../../auth.service';
import { apiClient } from '../../../lib/apiClient';
import { QUEUE_UPDATED_EVENT, readAssignedVisits, updateAssignedVisitStatus, type AssignedVisit } from '../../shared/queueBridge';
import { readDoctorData, writeDoctorData } from '../services/doctorStorage';

interface DoctorQueueItem {
  id: string;
  token: string;
  name: string;
  mrn: string;
  arrival: string;
  wait: string;
  priority: string;
  status: string;
  assignedByReception: boolean;
}

const demoQueue: DoctorQueueItem[] = [
  { id: 'demo-18', token: 'OPD-018', name: 'Muhammad Hamza', mrn: 'MH-240321', arrival: '09:12 AM', wait: '18 min', priority: 'Urgent', status: 'Waiting', assignedByReception: false },
  { id: 'demo-19', token: 'OPD-019', name: 'Sana Iqbal', mrn: 'MH-240327', arrival: '09:24 AM', wait: '06 min', priority: 'Normal', status: 'Waiting', assignedByReception: false },
  { id: 'demo-20', token: 'OPD-020', name: 'Bilal Ahmed', mrn: 'MH-240329', arrival: '09:31 AM', wait: '02 min', priority: 'Normal', status: 'Waiting', assignedByReception: false },
  { id: 'demo-17', token: 'OPD-017', name: 'Ayesha Khan', mrn: 'MH-240318', arrival: '08:55 AM', wait: 'In consultation', priority: 'Normal', status: 'In consultation', assignedByReception: false },
];

function formatAssignedVisit(visit: AssignedVisit): DoctorQueueItem {
  const arrivalDate = visit.arrivalTime ? new Date(visit.arrivalTime) : null;
  return {
    id: visit.id,
    token: `OPD-${String(visit.tokenNumber).padStart(3, '0')}`,
    name: visit.patientName,
    mrn: visit.mrn,
    arrival: arrivalDate && !Number.isNaN(arrivalDate.getTime()) ? arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Booked',
    wait: visit.appointmentDate ?? 'Today',
    priority: visit.priority,
    status: visit.status,
    assignedByReception: true,
  };
}

export function DoctorQueuePage() {
  const doctorName = getCurrentSession()?.user.fullName ?? '';
  const [assigned, setAssigned] = useState<DoctorQueueItem[]>(() => isMockAuthEnabled() ? readAssignedVisits(doctorName).map(formatAssignedVisit) : []);
  const [started, setStarted] = useState<string[]>(() => readDoctorData('started-consultations', []));

  useEffect(() => {
    const refresh = () => {
      if (isMockAuthEnabled()) {
        setAssigned(readAssignedVisits(doctorName).map(formatAssignedVisit));
        return;
      }
      void apiClient.get<Array<{ id: number; tokenNumber: number; appointmentTime: string; patientName: string; mrn: string; status: string }>>('/appointments/mine')
        .then((records) => setAssigned(records.map((item) => ({
          id: String(item.id), token: `OPD-${String(item.tokenNumber).padStart(3, '0')}`, name: item.patientName, mrn: item.mrn,
          arrival: item.appointmentTime, wait: 'Booked', priority: 'Normal', status: item.status, assignedByReception: true,
        })))).catch(() => undefined);
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(QUEUE_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(QUEUE_UPDATED_EVENT, refresh);
    };
  }, [doctorName]);

  const queue = useMemo(() => {
    // Demo patients exist only in mock mode; real API mode must show genuine
    // database appointments exclusively.
    if (!isMockAuthEnabled()) return assigned;
    const assignedMrns = new Set(assigned.map((item) => item.mrn));
    return [...assigned, ...demoQueue.filter((item) => !assignedMrns.has(item.mrn))];
  }, [assigned]);

  const [statusError, setStatusError] = useState('');

  const startConsultation = (item: DoctorQueueItem) => {
    // Commit the status change only after the server confirms it, so the UI
    // never shows "In consultation" for an appointment the database rejected.
    if (item.assignedByReception && !isMockAuthEnabled()) {
      void apiClient.patch(`/appointments/${encodeURIComponent(item.id)}/status`, { status: 'In consultation' })
        .then(() => {
          setStatusError('');
          const next = [...new Set([...started, item.mrn])];
          setStarted(next);
          writeDoctorData('started-consultations', next);
        })
        .catch(() => setStatusError(`Could not start the consultation for ${item.name}. Please try again.`));
      return;
    }
    const next = [...new Set([...started, item.mrn])];
    setStarted(next);
    writeDoctorData('started-consultations', next);
    if (item.assignedByReception) updateAssignedVisitStatus(item.id, 'In consultation');
  };

  const waitingCount = queue.filter((item) => (item.status === 'Waiting' || item.status === 'Scheduled') && !started.includes(item.mrn)).length;
  const consultingCount = queue.filter((item) => item.status === 'In consultation' || started.includes(item.mrn)).length;

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-semibold text-teal-700">OPD clinical workspace</p><h2 className="mt-1 text-3xl font-bold text-slate-900">OPD queue</h2><p className="mt-2 text-sm text-slate-500">Reception assignments for {doctorName || 'this doctor'} appear here automatically.</p></div>
      <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800"><Users className="h-5 w-5" />{waitingCount} waiting</div>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Waiting patients" value={String(waitingCount).padStart(2, '0')} tone="amber" /><Metric label="In consultation" value={String(consultingCount).padStart(2, '0')} tone="blue" /><Metric label="Reception assignments" value={String(assigned.length).padStart(2, '0')} tone="teal" /></div>
    {statusError ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{statusError}</p> : null}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">Today’s OPD queue</h3><p className="mt-1 text-sm text-slate-500">Live reception-to-doctor queue</p></div><span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live queue</span></div>
      <div className="divide-y divide-slate-100">{queue.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 p-5 hover:bg-slate-50">
        <div className="flex h-11 w-16 items-center justify-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700">{item.token}</div>
        <Link to={`/doctor/patients/${encodeURIComponent(item.mrn)}`} className="flex min-w-[190px] flex-1 items-center gap-3 rounded-xl p-1 hover:bg-teal-50"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.mrn} · Arrived {item.arrival}</p></div></Link>
        <div className="flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4" />{item.wait}</div>
        {item.assignedByReception ? <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Reception</span> : null}
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${['Urgent', 'Emergency'].includes(item.priority) ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{item.priority}</span>
        {item.status === 'In consultation' || started.includes(item.mrn) ? <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">In consultation</span> : <button type="button" onClick={() => startConsultation(item)} className="flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"><PlayCircle className="h-4 w-4" />Start consultation</button>}
      </div>)}</div>
    </section>
  </div>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'blue' | 'teal' }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${tone === 'amber' ? 'text-amber-600' : tone === 'blue' ? 'text-sky-700' : 'text-teal-700'}`}>{value}</p></div>;
}
