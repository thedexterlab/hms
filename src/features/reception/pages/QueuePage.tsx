import { useQuery } from '@tanstack/react-query';
import { getQueue } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function QueuePage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['queue-list'], queryFn: getQueue });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">OPD queue management</h2>
        <p className="text-sm text-slate-500">Track current queue status and patient movement without exposing clinical details.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3">Token</th>
              <th className="px-3 py-3">Patient</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Doctor</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Waiting</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100">
                <td className="px-3 py-3 font-semibold">#{entry.tokenNumber}</td>
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-800">{entry.patientName}</p>
                  <p className="text-xs text-slate-500">{entry.mrn}</p>
                </td>
                <td className="px-3 py-3">{entry.department}</td>
                <td className="px-3 py-3">{entry.doctor}</td>
                <td className="px-3 py-3">{entry.priority}</td>
                <td className="px-3 py-3">{entry.status}</td>
                <td className="px-3 py-3">{entry.waitingDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
