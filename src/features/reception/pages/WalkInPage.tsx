import { HospitalLogo } from '../../../components/common/HospitalLogo';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createAppointment, getPatientById, searchPatients, searchPatientsByIdentity } from '../services/receptionService';
import type { PatientRecord } from '../types';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { notifyQueueUpdated } from '../../shared/queueBridge';

const doctorsByDepartment: Record<string, string[]> = {
  'General Medicine': ['Dr. Master Doctor', 'Dr. OPD Doctor', 'Dr. General Physician', 'Dr. Sarah Ahmed', 'Dr. Farhan Ali'],
  Pediatrics: ['Dr. Child Specialist', 'Dr. Ali Raza', 'Dr. Hina Malik'],
  Gynecology: ['Dr. Gynae Specialist', 'Dr. Hina Shah', 'Dr. Sana Noor'],
};

export function WalkInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const doctorParam = params.get('doctor') ?? '';
  const doctorIdParam = params.get('doctorId') ?? '';
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<PatientRecord[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<PatientRecord[]>([]);
  const [selected, setSelected] = useState<PatientRecord | null>(null);
  // Deep-link support: arriving from "Book with this doctor" pre-selects the
  // doctor and their owning department; unknown names fall back to the default.
  const initialDoctor = doctorParam && Object.values(doctorsByDepartment).some((names) => names.includes(doctorParam)) ? doctorParam : doctorsByDepartment['General Medicine'][0];
  const [department, setDepartment] = useState(() => Object.keys(doctorsByDepartment).find((dept) => doctorsByDepartment[dept].includes(initialDoctor)) ?? 'General Medicine');
  const [doctor, setDoctor] = useState(initialDoctor);
  const [priority, setPriority] = useState('Normal');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateError, setDateError] = useState('');
  const [message, setMessage] = useState('');
  const [createdVisit, setCreatedVisit] = useState<{ tokenNumber: number; patientName: string; mrn: string; department: string; doctor: string; date: string } | null>(null);
  const [pendingVisit, setPendingVisit] = useState<{ patientId: string; patientName: string; mrn: string; department: string; doctor: string; doctorId: string; priority: string; date: string } | null>(null);

  useEffect(() => {
    searchPatients('').then(setRegisteredPatients);
  }, []);

  const search = async () => {
    const found = await searchPatientsByIdentity(query);
    setMatches(found.length ? found : registeredPatients);
  };

  const selectPatient = async (patient: PatientRecord) => {
    setSelected(patient);
    setMatches([]);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!date || date < today) {
      setDateError('Appointment date cannot be in the past.');
      return;
    }
    setDateError('');
    const detail = await getPatientById(selected.id);
    // Safety: the appointment record is only written in confirmVisit, after the
    // user explicitly confirms the prepared booking.
    setPendingVisit({ patientId: selected.id, patientName: detail.fullName, mrn: detail.mrn, department, doctor, doctorId: doctorIdParam || doctor, priority, date });
  };

  // Performs the confirmed write after explicit user confirmation.
  const confirmVisit = async () => {
    if (!pendingVisit) return;
    const savedAppointments = JSON.parse(localStorage.getItem('hms-appointments') ?? '[]') as Array<{ tokenNumber?: number }>;
    const savedWalkIns = JSON.parse(localStorage.getItem('hms-walk-ins') ?? '[]') as Array<{ tokenNumber?: number }>;
    const tokenNumber = [...savedAppointments, ...savedWalkIns].reduce((highest, item) => Math.max(highest, Number(item.tokenNumber) || 0), 100) + 1;
    const created = await createAppointment({
      patientId: Number(pendingVisit.patientId) || pendingVisit.patientId,
      department: pendingVisit.department,
      doctorId: pendingVisit.doctorId,
      appointmentDate: pendingVisit.date,
      appointmentTime: new Date().toTimeString().slice(0, 5),
      appointmentType: 'OPD',
      priority: pendingVisit.priority,
      paymentStatus: 'Pending',
    });
    const finalToken = created.tokenNumber ?? tokenNumber;
    if (!created.tokenNumber) {
      const visit = { id: created.id === 'apt-new' ? `walkin-${Date.now()}` : created.id, tokenNumber: finalToken, patientId: pendingVisit.patientId, patientName: pendingVisit.patientName, mrn: pendingVisit.mrn, department: pendingVisit.department, doctor: pendingVisit.doctor, priority: pendingVisit.priority, status: 'Waiting', appointmentDate: pendingVisit.date, arrivalTime: new Date().toISOString() };
      localStorage.setItem('hms-walk-ins', JSON.stringify([visit, ...savedWalkIns]));
    }
    notifyQueueUpdated();
    setCreatedVisit({ tokenNumber: finalToken, patientName: pendingVisit.patientName, mrn: pendingVisit.mrn, department: pendingVisit.department, doctor: pendingVisit.doctor, date: pendingVisit.date });
    setMessage(`Appointment booked with ${pendingVisit.doctor} for ${pendingVisit.patientName} on ${pendingVisit.date}.`);
    setPendingVisit(null);
  };

  const changeDepartment = (value: string) => {
    setDepartment(value);
    setDoctor(doctorsByDepartment[value][0]);
  };

  return <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Appointment booking</h2>
      <p className="mt-1 text-sm text-slate-500">Find an existing patient by phone number or MR number, then pick a date and assign an available doctor.</p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="mb-2 block text-sm font-semibold text-slate-800">Search patient</label>
      <div className="flex gap-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && search()} placeholder="Phone number or MR number" className="flex-1 rounded-xl border border-slate-200 px-3 py-2" />
        <button type="button" onClick={search} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Search</button>
      </div>
      {matches.length > 0 ? <div className="mt-3 space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select patient</p>{matches.map((patient) => <button type="button" key={patient.id} onClick={() => selectPatient(patient)} className="block w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-teal-50"><span className="font-semibold">{patient.fullName}</span><span className="ml-3 text-sm text-slate-500">{patient.mobile} · {patient.mrn}</span></button>)}</div> : null}
      {query && !matches.length && !selected ? <p className="mt-3 text-sm text-slate-500">No registered patients are available. Register the patient first.</p> : null}
    </div>

    {selected ? <form onSubmit={submit} className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
      <div className="rounded-xl border border-teal-100 bg-white p-3"><p className="font-semibold text-slate-900">{selected.fullName}</p><p className="text-sm text-slate-500">{selected.mrn} · {selected.mobile}</p></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <select disabled={Boolean(doctorIdParam)} value={department} onChange={(event) => changeDepartment(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-100">{Object.keys(doctorsByDepartment).map((item) => <option key={item}>{item}</option>)}</select>
        <select disabled={Boolean(doctorIdParam)} value={doctor} onChange={(event) => setDoctor(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-100">{doctorsByDepartment[department].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2"><option>Normal</option><option>Urgent</option><option>Emergency</option></select>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Appointment date</span>
          <input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
        </label>
      </div>
      {dateError ? <p className="mt-3 text-sm font-semibold text-rose-700">{dateError}</p> : null}
      <button type="submit" className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Book appointment</button>
      <button type="button" onClick={() => navigate(`/reception/patients/${selected.id}`)} className="ml-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View profile</button>
      {message ? <p className="mt-3 text-sm font-semibold text-teal-800">{message}</p> : null}
      {createdVisit ? <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4"><div className="print-walkin-slip text-center"><HospitalLogo className="mx-auto mb-3 h-20 w-20" /><p className="mb-2 font-bold text-slate-900">Mastan Hospital</p><p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Appointment slip</p><p className="mt-2 text-4xl font-bold text-slate-900">#{createdVisit.tokenNumber}</p><p className="mt-2 text-sm text-slate-700">{createdVisit.patientName} · {createdVisit.mrn}</p><p className="text-sm text-slate-700">{createdVisit.department} · {createdVisit.doctor}</p><p className="text-sm text-slate-700">{createdVisit.date}</p></div><button type="button" onClick={() => window.print()} className="no-print mt-4 w-full rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Print appointment slip</button></div> : null}
    </form> : null}
    {params.get('patientId') && !selected ? <p className="text-sm text-slate-500">Search using the patient’s phone number or MR number to continue.</p> : null}

    <ConfirmDialog
      open={pendingVisit !== null}
      title="Confirm appointment booking"
      description="Please verify the details before the appointment is created."
      detail={
        pendingVisit ? (
          <div className="space-y-1 text-sm text-slate-700">
            <p><span className="font-semibold">Patient:</span> {pendingVisit.patientName} ({pendingVisit.mrn})</p>
            <p><span className="font-semibold">Doctor:</span> {pendingVisit.doctor}</p>
            <p><span className="font-semibold">Department:</span> {pendingVisit.department}</p>
            <p><span className="font-semibold">Date:</span> {pendingVisit.date}</p>
            <p><span className="font-semibold">Priority:</span> {pendingVisit.priority}</p>
          </div>
        ) : null
      }
      confirmLabel="Book appointment"
      onConfirm={confirmVisit}
      onCancel={() => setPendingVisit(null)}
    />
  </div>;
}
