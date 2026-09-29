import { useQuery } from '@tanstack/react-query';
import { listActivity } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function AdminActivityPage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['admin-activity'], queryFn: listActivity });

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Audit activity log</h2>
        <p className="text-sm text-slate-500">Every sensitive action recorded by the backend — who did what, when and from where.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">IP address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 text-slate-700">{new Date(event.occurredAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-700">{event.actorId}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{event.action}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{event.entityType} #{event.entityId}</td>
                <td className="px-4 py-3 text-slate-700">{event.reason ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{event.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No activity recorded yet.</p> : null}
      </div>
    </div>
  );
}
