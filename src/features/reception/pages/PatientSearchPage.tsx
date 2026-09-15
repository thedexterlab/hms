import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchPatients } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';

export function PatientSearchPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['patient-search', query || 'all'],
    queryFn: () => searchPatients(query),
  });

  const paged = useMemo(() => data.slice((page - 1) * 5, page * 5), [data, page]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Patient search</h2>
            <p className="text-sm text-slate-500">Search by MRN, patient name, mobile, guardian name, or registration date.</p>
          </div>
          <label className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} className="w-full bg-transparent outline-none" placeholder="Search patients" />
          </label>
        </div>
      </div>

      {isLoading ? <LoadingSkeleton rows={5} /> : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load this information. Please try again.</div> : data.length === 0 ? <EmptyState title="No patients found" description="Try a broader search term or register a new patient." /> : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">MRN</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Guardian</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((patient) => (
                  <tr key={patient.id} className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50" onClick={() => navigate(`/reception/patients/${patient.id}`)}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-900">{patient.fullName}</div>
                        <ArrowRight className="h-4 w-4 text-teal-700" aria-hidden="true" />
                      </div>
                      <p className="text-xs text-slate-500">{patient.age} yrs • {patient.gender}</p>
                    </td>
                    <td className="px-3 py-3">{patient.mrn}</td>
                    <td className="px-3 py-3">{patient.mobile}</td>
                    <td className="px-3 py-3">{patient.guardianName}</td>
                    <td className="px-3 py-3">{patient.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(data.length / 5))} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
