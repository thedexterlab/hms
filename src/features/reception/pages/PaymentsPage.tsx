import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { paymentSchema } from '../schemas/patientSchemas';
import { createPayment, searchPatients } from '../services/receptionService';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export function PaymentsPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(paymentSchema), defaultValues: { patientId: '', appointmentId: '', chargeType: 'Registration fee', amount: 0, paymentMethod: 'Cash', referenceNumber: '', notes: '' } });
  const mutation = useMutation({ mutationFn: createPayment });
  // Patient must be chosen from the registered list — free-text patient IDs
  // allow payments to be attached to the wrong (or non-existent) record.
  const { data: registeredPatients = [] } = useQuery({ queryKey: ['patients-list'], queryFn: () => searchPatients('') });
  // Safety: financial amounts are never written on a single click. The form
  // only prepares the payment; the record is created after explicit
  // confirmation (backend must remain transactional and audit-logged).
  const [pendingPayment, setPendingPayment] = useState<Record<string, unknown> | null>(null);

  const onSubmit = async (values: any) => {
    setPendingPayment(values as Record<string, unknown>);
  };

  const confirmPayment = async () => {
    if (!pendingPayment) return;
    await mutation.mutateAsync(pendingPayment);
    setPendingPayment(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Basic payment recording</h2>
        <p className="text-sm text-slate-500">Capture approved front-desk fees only.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Patient</label>
            <select {...register('patientId')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="">Select patient</option>
              {registeredPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.mrn}</option>
              ))}
            </select>
            {errors.patientId ? <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Charge type</label>
            <select {...register('chargeType')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="Registration fee">Registration fee</option>
              <option value="Consultation fee">Consultation fee</option>
              <option value="Laboratory">Laboratory</option>
              <option value="X-ray / Imaging">X-ray / Imaging</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Procedure">Procedure</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Amount</label>
            <input type="number" step="0.01" {...register('amount')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            {errors.amount ? <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Payment method</label>
            <select {...register('paymentMethod')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank transfer">Bank transfer</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Easypaisa">Easypaisa</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Reference number</label>
            <input {...register('referenceNumber')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Note</label>
            <input {...register('notes')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="mt-6 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Record payment</button>
      </form>

      <ConfirmDialog
        open={pendingPayment !== null}
        title="Confirm payment entry"
        description="Financial records are permanent. Please verify the amount before recording."
        detail={
          pendingPayment ? (
            <div className="space-y-1 text-sm text-slate-700">
              <p><span className="font-semibold">Patient:</span> {String(pendingPayment.patientId ?? '—')}</p>
              <p><span className="font-semibold">Charge:</span> {String(pendingPayment.chargeType ?? '—')}</p>
              <p><span className="font-semibold">Amount:</span> PKR {String(pendingPayment.amount ?? '—')}</p>
              <p><span className="font-semibold">Method:</span> {String(pendingPayment.paymentMethod ?? '—')}</p>
              {pendingPayment.referenceNumber ? <p><span className="font-semibold">Reference:</span> {String(pendingPayment.referenceNumber)}</p> : null}
            </div>
          ) : null
        }
        confirmLabel="Record payment"
        onConfirm={confirmPayment}
        onCancel={() => setPendingPayment(null)}
      />
    </div>
  );
}
