import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import type { BroadcastInput } from '../types';
import { broadcast, listNotifications } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

const AUDIENCES = ['All', 'Reception', 'Doctor', 'Pharmacy', 'Laboratory'];
const SEVERITIES = ['info', 'warning', 'critical'];

export function AdminBroadcastPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [severity, setSeverity] = useState('info');
  const [audience, setAudience] = useState('All');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['admin-notifications'], queryFn: listNotifications });

  const send = useMutation({
    mutationFn: (input: BroadcastInput) => broadcast(input),
    onSuccess: () => {
      setSuccess(true);
      setTitle('');
      setDetail('');
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: () => setFormError('Broadcast failed. Please try again.'),
  });

  const submit = () => {
    setFormError(null);
    setSuccess(false);
    if (title.trim().length < 3 || detail.trim().length < 3) {
      setFormError('Title and detail are required (at least 3 characters).');
      return;
    }
    send.mutate({ title, detail, severity, audience });
  };

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      {/* __FORM__ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Broadcast center</h2>
        <p className="text-sm text-slate-500">Publish announcements to specific hospital departments or everyone at once.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500" placeholder="e.g. OPD closing early today" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Audience
            <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500">
              {AUDIENCES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Detail
            <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500" placeholder="What should the audience know?" />
          </label>
          <div className="text-sm font-medium text-slate-700">
            Severity
            <div className="mt-2 flex gap-2">
              {SEVERITIES.map((item) => (
                <button key={item} type="button" onClick={() => setSeverity(item)} className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${severity === item ? 'bg-teal-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {formError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p> : null}
        {success ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Broadcast published successfully.</p> : null}

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={submit} disabled={send.isPending} className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            {send.isPending ? 'Publishing…' : 'Publish broadcast'}
          </button>
        </div>
      </div>

      {/* __LIST__ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Recent broadcasts & alerts</h3>
        <div className="mt-4 space-y-3">
          {data.map((notification) => (
            <div key={notification.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.severity === 'critical' ? 'bg-rose-500' : notification.severity === 'warning' ? 'bg-amber-500' : 'bg-sky-500'}`} aria-hidden="true" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">{notification.audience}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.detail}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {data.length === 0 ? <p className="text-center text-sm text-slate-500">No notifications yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
