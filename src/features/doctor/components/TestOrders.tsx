import { useState } from 'react';
import { readDoctorData, writeDoctorData } from '../services/doctorStorage';

const groups = {
  'Blood tests': ['Complete blood count (CBC)', 'Blood glucose', 'HbA1c', 'Liver function tests (LFT)', 'Renal function tests (RFT)', 'Lipid profile', 'Thyroid profile (TSH)', 'Vitamin D', 'Blood culture'],
  'Urine and stool': ['Urine routine examination', 'Urine culture', 'Stool examination'],
  'Imaging and other tests': ['Chest X-ray', 'Abdominal ultrasound', 'Pelvic ultrasound', 'ECG', 'Echocardiogram', 'CT scan', 'MRI'],
};
type Order = { id?: string; patientMrn: string; patientName: string; study: string; type: string; clinicalDetails: string; status: string; destination?: string; provider?: string; createdAt?: string };

export function TestOrders({ patientMrn, patientName }: { patientMrn: string; patientName: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [includeCustom, setIncludeCustom] = useState(false);
  const [destination, setDestination] = useState('Hospital lab');
  const [provider, setProvider] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>(() => readDoctorData('diagnostic-orders', []));
  const save = () => {
    if (includeCustom && !custom.trim()) { setMessage('Enter the other test name.'); return; }
    const studies = [...new Set([...selected, ...(includeCustom ? [custom.trim()] : [])])];
    if (!studies.length) { setMessage('Select at least one test.'); return; }
    if (!details.trim()) { setMessage('Enter clinical details for the selected tests.'); return; }
    const createdAt = new Date().toISOString();
    const added: Order[] = studies.map((study) => ({
      id: crypto.randomUUID(), patientMrn, patientName, study,
      type: study.includes('X-ray') ? 'X-ray' : study.includes('ultrasound') ? 'Ultrasound' : 'Laboratory / other',
      clinicalDetails: details.trim(), destination, provider: destination === 'Outside lab' ? provider.trim() || 'Patient choice' : 'Hospital diagnostics',
      status: destination === 'Outside lab' ? 'External referral' : 'Requested', createdAt,
    }));
    const next = [...added, ...readDoctorData<Order[]>('diagnostic-orders', [])];
    try { writeDoctorData('diagnostic-orders', next); } catch { setMessage('Could not save tests. Please try again.'); return; }
    setOrders(next); setSelected([]); setCustom(''); setIncludeCustom(false); setDetails('');
    setMessage(`${added.length} test(s) saved${destination === 'Outside lab' ? ' as an outside-lab referral' : ''}.`);
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="font-bold text-slate-900">Tests and investigations</h3>
    <p className="mt-1 text-sm text-slate-500">Select all required tests, including tests to be performed outside the hospital.</p>
    {Object.entries(groups).map(([group, tests]) => <fieldset key={group} className="mt-5"><legend className="text-sm font-semibold text-slate-700">{group}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{tests.map((test) => <label key={test} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm"><input type="checkbox" className="accent-teal-700" checked={selected.includes(test)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, test] : current.filter((item) => item !== test))} />{test}</label>)}</div></fieldset>)}
    <label className="mt-4 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={includeCustom} onChange={(e) => setIncludeCustom(e.target.checked)} />Other test</label>
    {includeCustom ? <label className="mt-2 block text-sm">Other test name<input className="mt-1 w-full rounded-lg border p-2" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Test name and study details" /></label> : null}
    <label className="mt-4 block text-sm font-semibold">Test location<select className="mt-2 w-full rounded-lg border p-2" value={destination} onChange={(e) => setDestination(e.target.value)}><option>Hospital lab</option><option>Outside lab</option></select></label>
    {destination === 'Outside lab' ? <label className="mt-3 block text-sm">Outside lab / diagnostic centre (optional)<input className="mt-1 w-full rounded-lg border p-2" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Patient choice if left blank" /></label> : null}
    <label className="mt-4 block text-sm font-semibold">Clinical details<textarea className="mt-2 w-full rounded-lg border p-2" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
    <button type="button" onClick={save} className="mt-4 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white">Save selected tests</button>
    {message ? <p role="status" className="mt-3 text-sm text-teal-800">{message}</p> : null}
    <h4 className="mt-6 font-semibold">Requested tests / referrals</h4>
    <div className="mt-3 space-y-2">{orders.filter((order) => order.patientMrn === patientMrn).map((order, index) => <div key={order.id ?? index} className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold">{order.study}</p><p>{order.destination ?? 'Hospital lab'} · {order.provider ?? 'Hospital diagnostics'} · {order.status}</p><p className="mt-1 text-slate-600">{order.clinicalDetails}</p></div>)}</div>
  </section>;
}
