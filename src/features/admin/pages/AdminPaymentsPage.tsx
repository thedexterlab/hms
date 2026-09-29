import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listPayments } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function AdminPaymentsPage() {
  const [date, setDate] = useState('');
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['admin-payments', date], queryFn: () => listPayments(date || undefined) });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const total = data.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Payment oversight</h2>
          <p className="text-sm text-slate-500">Every payment recorded across reception, pharmacy and laboratory counters.</p>
        </div>
        <div className="rounded-xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
          Total: Rs. {total.toLocaleString()} ({data.length} record{data.length === 1 ? '' : 's'})
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:max-w-xs">
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="bg-transparent outline-none" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Recorded by</th>
              <th className="px-4 py-3">Recorded at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{payment.patientName}</p>
                  <p className="text-xs text-slate-500">{payment.mrn}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">Rs. {payment.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-700">{payment.method}</td>
                <td className="px-4 py-3 text-slate-700">{payment.category}</td>
                <td className="px-4 py-3 text-slate-700">{payment.reference ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{payment.recordedBy}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(payment.recordedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No payments recorded for this date.</p> : null}
      </div>
    </div>
  );
}
