import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { listPatients } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function AdminPatientsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['admin-patients', query], queryFn: () => listPatients(query) });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Patient records</h2>
        <p className="text-sm text-slate-500">Central registry of every registered patient. Search by name, MRN or mobile number.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search);
          }}
        >
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, MRN or mobile" className="w-full bg-transparent outline-none" />
          </label>
          <button type="submit" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">Search</button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">MRN</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Gender / Age</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((patient) => (
              <tr key={patient.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{patient.mrn}</td>
                <td className="px-4 py-3 text-slate-700">{patient.fullName}</td>
                <td className="px-4 py-3 text-slate-700">{patient.gender}{patient.approximateAge ? `, ${patient.approximateAge}` : ''}</td>
                <td className="px-4 py-3 text-slate-700">{patient.primaryMobile}</td>
                <td className="px-4 py-3 text-slate-700">{patient.department}</td>
                <td className="px-4 py-3 text-slate-700">{patient.registeredAt}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${patient.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{patient.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No patients match your search.</p> : null}
      </div>
    </div>
  );
}
