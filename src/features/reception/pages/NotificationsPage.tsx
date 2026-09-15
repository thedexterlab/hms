import { BellRing, AlertTriangle, CircleAlert, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function NotificationsPage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['notifications-page'], queryFn: getNotifications });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500">Operational updates and important reception notices.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const Icon = item.severity === 'critical' ? CircleAlert : item.severity === 'warning' ? AlertTriangle : Info;
          return (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${item.severity === 'critical' ? 'bg-red-100 text-red-700' : item.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
