import { UserCircle2, ShieldCheck, Mail } from 'lucide-react';
import { getCurrentSession } from '../../../auth.service';

export function AdminProfilePage() {
  const session = getCurrentSession();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">My profile</h2>
        <p className="text-sm text-slate-500">Your administrator account details.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-teal-50 p-4 text-teal-700"><UserCircle2 className="h-10 w-10" aria-hidden="true" /></span>
          <div>
            <p className="text-lg font-semibold text-slate-900">{user?.fullName ?? 'Administrator'}</p>
            <p className="text-sm text-slate-500">{user?.departmentName ?? 'Hospital Administration'}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Mail className="h-3.5 w-3.5" aria-hidden="true" /> Account ID</dt>
            <dd className="mt-1 text-sm text-slate-800">{user?.id ?? '—'}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Roles</dt>
            <dd className="mt-1 text-sm text-slate-800">{(user?.roles ?? []).join(', ') || '—'}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Granted permissions</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {(user?.permissions ?? []).map((permission) => (
                <span key={permission} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{permission}</span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
