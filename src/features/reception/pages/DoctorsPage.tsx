import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, DoorOpen, Search, Stethoscope } from 'lucide-react';
import { getDoctors } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

const statusStyles: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700',
  'On Round': 'bg-amber-100 text-amber-700',
  'Off Duty': 'bg-slate-100 text-slate-500',
};

export function DoctorsPage() {
  const navigate = useNavigate();
  // Availability changes as doctors log in/heartbeat/auto clock-out (the server
  // monitor runs every minute) — keep the directory fresh with a 30s poll.
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['doctors-list'], queryFn: getDoctors, refetchInterval: 30_000 });
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const departments = ['All', ...Array.from(new Set(data.map((doctor) => doctor.department)))];
  const filtered = data.filter((doctor) => {
    const matchesDepartment = departmentFilter === 'All' || doctor.department === departmentFilter;
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || [doctor.name, doctor.department, doctor.room].some((value) => value.toLowerCase().includes(normalized));
    return matchesDepartment && matchesQuery;
  });
  const availableCount = filtered.filter((doctor) => doctor.status === 'Available').length;

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Available doctors</h2>
        <p className="text-sm text-slate-500">Check who is on duty before booking an appointment. Statuses update with the daily roster.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by doctor, department or room"
              className="w-full bg-transparent outline-none"
            />
          </label>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            {departments.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          <span className="font-semibold text-emerald-700">{availableCount}</span> of {filtered.length} shown doctors currently available.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No doctors match your search.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doctor) => (
            <div key={doctor.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Stethoscope className="h-5 w-5" aria-hidden="true" /></span>
                  <div>
                    <p className="font-semibold text-slate-900">{doctor.name}</p>
                    <p className="text-sm text-slate-500">{doctor.department}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[doctor.status] ?? 'bg-slate-100 text-slate-700'}`}>{doctor.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" /> OPD hours: {doctor.opdHours}</p>
                <p className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-slate-400" aria-hidden="true" /> {doctor.room}</p>
              </div>
              <button
                type="button"
                disabled={doctor.status !== 'Available'}
                onClick={() => navigate(`/reception/walk-ins/new?doctor=${encodeURIComponent(doctor.name)}&doctorId=${encodeURIComponent(doctor.id)}`)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> Book with this doctor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
