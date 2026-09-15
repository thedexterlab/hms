import { useQuery } from '@tanstack/react-query';
import { getReceptionActivity } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function ActivityPage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['reception-activity'], queryFn: getReceptionActivity });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        <p className="text-sm text-slate-500">Permitted receptionist actions and their status.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Entity</th>
              <th className="px-3 py-3">Date and time</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, index) => (
              <tr key={`${entry.action}-${index}`} className="border-t border-slate-100">
                <td className="px-3 py-3">{entry.action}</td>
                <td className="px-3 py-3">{entry.entity}</td>
                <td className="px-3 py-3">{entry.timestamp}</td>
                <td className="px-3 py-3">{entry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
