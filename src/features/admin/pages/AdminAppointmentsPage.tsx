import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Ban } from 'lucide-react';
import type { AdminAppointment } from '../types';
import { cancelAppointment, listAppointments } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

const STATUSES = ['All', 'Scheduled', 'Confirmed', 'Checked In', 'Waiting', 'In consultation', 'Completed', 'Cancelled', 'No Show'];

export function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('All');
  const [cancelTarget, setCancelTarget] = useState<AdminAppointment | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['admin-appointments', date, status], queryFn: () => listAppointments(date || undefined, status) });

  const confirmCancel = async () => {
    if (!cancelTarget || reason.trim().length < 3) return;
    setActionError(null);
    try {
      await cancelAppointment(cancelTarget.id, reason);
      setCancelTarget(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancel failed.');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Appointment oversight</h2>
        <p className="text-sm text-slate-500">Review bookings across every department. Administrators may cancel a booking with a documented reason.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="bg-transparent outline-none" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          {STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {actionError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{actionError}</div> : null}

      {/* __TABLE__ */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Date / Time</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">#{appointment.tokenNumber}</td>
                <td className="px-4 py-3 text-slate-700">{appointment.appointmentDate} {appointment.appointmentTime}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-900">{appointment.patientName}</p>
                  <p className="text-xs text-slate-500">{appointment.mrn}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{appointment.doctor}</td>
                <td className="px-4 py-3 text-slate-700">{appointment.department}</td>
                <td className="px-4 py-3 text-slate-700">{appointment.appointmentType}</td>
                <td className="px-4 py-3"><StatusBadge value={appointment.status} /></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${appointment.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{appointment.paymentStatus}</span>
                </td>
                <td className="px-4 py-3">
                  {!['Completed', 'Cancelled', 'No Show'].includes(appointment.status) ? (
                    <button type="button" onClick={() => setCancelTarget(appointment)} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                      <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Cancel
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No appointments match your filters.</p> : null}
      </div>

      {/* __DIALOG__ */}
      {cancelTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Cancel appointment #{cancelTarget.tokenNumber}</h3>
            <p className="mt-2 text-sm text-slate-600">
              Cancelling <span className="font-semibold">{cancelTarget.patientName}</span> with {cancelTarget.doctor} on {cancelTarget.appointmentDate}. The reception team will be notified with your reason.
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for cancellation (required)"
              rows={3}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setCancelTarget(null); setReason(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Keep booking</button>
              <button type="button" onClick={confirmCancel} disabled={reason.trim().length < 3} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300">Cancel appointment</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Scheduled: 'bg-sky-100 text-sky-700',
    Confirmed: 'bg-sky-100 text-sky-700',
    'Checked In': 'bg-emerald-100 text-emerald-700',
    Waiting: 'bg-amber-100 text-amber-700',
    'In consultation': 'bg-violet-100 text-violet-700',
    Completed: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-rose-100 text-rose-700',
    'No Show': 'bg-rose-100 text-rose-700',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[value] ?? 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}
