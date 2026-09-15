import { HospitalLogo } from '../../../components/common/HospitalLogo';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { searchPatientsByIdentity } from '../services/receptionService';
import type { PatientRecord } from '../types';

export function PrintCenterPage() {
  const [identityQuery, setIdentityQuery] = useState('');
  const [matches, setMatches] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [test, setTest] = useState('');
  const [labToken, setLabToken] = useState<{ token: number; patientName: string; mrn: string; test: string } | null>(null);

  const generateLabToken = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPatient || !test.trim()) return;
    const saved = JSON.parse(localStorage.getItem('hms-lab-tokens') ?? '[]') as Array<{ token?: number }>;
    const token = saved.reduce((highest, item) => Math.max(highest, Number(item.token) || 0), 0) + 1;
    const nextToken = { token, patientName: selectedPatient.fullName, mrn: selectedPatient.mrn, mobile: selectedPatient.mobile, test: test.trim() };
    localStorage.setItem('hms-lab-tokens', JSON.stringify([nextToken, ...saved]));
    setLabToken(nextToken);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Print center</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Patient print workflows</h2>
            <p className="mt-1 text-sm text-slate-500">Generate patient cards, appointment receipts, and referral slips for front-desk operations.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Available for reception use
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Laboratory token</h3>
          <p className="mt-2 text-sm text-slate-600">Generate and print a queue token for lab tests.</p>
          <form onSubmit={generateLabToken} className="mt-5 space-y-3">
            <div className="flex gap-2"><input value={identityQuery} onChange={(event) => setIdentityQuery(event.target.value)} placeholder="Phone or MR number" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={async () => setMatches(await searchPatientsByIdentity(identityQuery))} className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white">Find</button></div>
            {matches.length ? <select value={selectedPatient?.id ?? ''} onChange={(event) => setSelectedPatient(matches.find((patient) => patient.id === event.target.value) ?? null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required><option value="">Select patient</option>{matches.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName} — {patient.mrn} — {patient.mobile}</option>)}</select> : null}
            {selectedPatient ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Selected: <strong>{selectedPatient.fullName}</strong> · {selectedPatient.mrn} · {selectedPatient.mobile}</p> : null}
            <select value={test} onChange={(event) => setTest(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required>
              <option value="">Select lab test</option><option>Blood test</option><option>Urine test</option><option>Radiology / X-ray</option><option>Ultrasound</option><option>Other</option>
            </select>
            <button type="submit" className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white">Generate lab token</button>
          </form>
          {labToken ? <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4"><div className="print-lab-token text-center"><HospitalLogo className="mx-auto mb-3 h-20 w-20" /><p className="mb-2 font-bold text-slate-900">Mastan Hospital</p><p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Laboratory token</p><p className="mt-2 text-4xl font-bold text-slate-900">#{labToken.token}</p><p className="mt-2 text-sm text-slate-700">{labToken.patientName} · {labToken.mrn}</p><p className="text-sm text-slate-700">Phone: {labToken.mobile}</p><p className="text-sm text-slate-700">{labToken.test}</p></div><button type="button" onClick={() => window.print()} className="no-print mt-4 w-full rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Print lab token</button></div> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Patient card print</h3>
          <p className="mt-2 text-sm text-slate-600">Create an on-demand patient card with MRN, contact info, and emergency contact details.</p>
          <div className="mt-5 space-y-4">
            <button type="button" className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800">Generate patient card</button>
            <button type="button" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Preview patient card</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Appointment slip</h3>
          <p className="mt-2 text-sm text-slate-600">Print appointment confirmations with date, doctor, and department details.</p>
          <div className="mt-5 space-y-4">
            <button type="button" className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">Generate appointment slip</button>
            <button type="button" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">View template</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Patient card', description: 'MRN, name, contact', action: 'Generate' },
            { label: 'Appointment slip', description: 'Visit date & doctor', action: 'Print' },
            { label: 'Referral slip', description: 'Specialist transfer', action: 'Prepare' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              <button type="button" className="mt-4 inline-flex rounded-full bg-teal-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">{item.action}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
