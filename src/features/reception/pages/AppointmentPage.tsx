import { useQuery } from '@tanstack/react-query';
import { getAppointments } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';
import { AppointmentStatusBadge } from '../components/AppointmentStatusBadge';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { getPatientById } from '../services/receptionService';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

const doctorsByDepartment: Record<string, string[]> = {
  'General Medicine': ['Dr. Sarah Ahmed', 'Dr. Farhan Ali'],
  Pediatrics: ['Dr. Ali Raza', 'Dr. Hina Malik'],
  Gynecology: ['Dr. Hina Shah', 'Dr. Sana Noor'],
};

export function AppointmentPage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['appointments-list'], queryFn: getAppointments });
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') ?? '';
  const [department, setDepartment] = useState('General Medicine');
  const [doctor, setDoctor] = useState(doctorsByDepartment['General Medicine'][0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointmentType, setAppointmentType] = useState('Consultation');
  const [message, setMessage] = useState('');
  const [pendingAppointment, setPendingAppointment] = useState<{ patientName: string; mrn: string; doctor: string; department: string; appointmentType: string; date: string } | null>(null);

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setDoctor(doctorsByDepartment[value][0]);
  };

  const bookAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId) return;
    const patient = await getPatientById(patientId);
    setPendingAppointment({ patientName: patient.fullName, mrn: patient.mrn, doctor, department, appointmentType, date });
    // Safety: the appointment record is only written in confirmAppointment,
    // after the user explicitly confirms the prepared booking.
  };


  // Performs the confirmed write after explicit user confirmation, so a stray
  // click or accidental Enter cannot silently create an appointment.
  const confirmAppointment = () => {
    if (!pendingAppointment) return;
    const appointment = { id: `apt-${Date.now()}`, tokenNumber: Date.now() % 1000, appointmentTime: pendingAppointment.date, patientName: pendingAppointment.patientName, mrn: pendingAppointment.mrn, doctor: pendingAppointment.doctor, department: pendingAppointment.department, appointmentType: pendingAppointment.appointmentType, status: 'Scheduled', paymentStatus: 'Pending' };
    const saved = JSON.parse(localStorage.getItem('hms-appointments') ?? '[]');
    localStorage.setItem('hms-appointments', JSON.stringify([appointment, ...saved]));
    setMessage(`Appointment booked with ${pendingAppointment.doctor} for ${pendingAppointment.patientName}.`);
    setPendingAppointment(null);
  };


  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Appointment management</h2>
        <p className="text-sm text-slate-500">Manage schedules, check-ins, rescheduling, and cancellations.</p>
      </div>

      {patientId ? <form onSubmit={bookAppointment} className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Book appointment / assign doctor</h3>
        <p className="mt-1 text-sm text-slate-600">Choose the doctor and visit details for this patient.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <select value={department} onChange={(event) => handleDepartmentChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2"><option>General Medicine</option><option>Pediatrics</option><option>Gynecology</option></select>
          <select value={doctor} onChange={(event) => setDoctor(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2">{doctorsByDepartment[department].map((doctorName) => <option key={doctorName}>{doctorName}</option>)}</select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2" />
          <select value={appointmentType} onChange={(event) => setAppointmentType(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <option value="Consultation">Consultation</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Procedure">Procedure</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>
        <button type="submit" className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Confirm appointment</button>
        {message ? <p className="mt-3 text-sm font-semibold text-teal-800">{message}</p> : null}
      </form> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3">Token</th>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Patient</th>
              <th className="px-3 py-3">Doctor</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {data.map((appointment) => (
              <tr key={appointment.id} className="border-t border-slate-100">
                <td className="px-3 py-3 font-semibold">#{appointment.tokenNumber}</td>
                <td className="px-3 py-3">{appointment.appointmentTime}</td>
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-800">{appointment.patientName}</p>
                  <p className="text-xs text-slate-500">{appointment.mrn}</p>
                </td>
                <td className="px-3 py-3">{appointment.doctor}</td>
                <td className="px-3 py-3">{appointment.department}</td>
                <td className="px-3 py-3"><AppointmentStatusBadge status={appointment.status} /></td>
                <td className="px-3 py-3">{appointment.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingAppointment !== null}
        title="Confirm appointment booking"
        description="Please verify the details before the appointment is created."
        detail={
          pendingAppointment ? (
            <div className="space-y-1 text-sm text-slate-700">
              <p><span className="font-semibold">Patient:</span> {pendingAppointment.patientName} ({pendingAppointment.mrn})</p>
              <p><span className="font-semibold">Doctor:</span> {pendingAppointment.doctor}</p>
              <p><span className="font-semibold">Department:</span> {pendingAppointment.department}</p>
              <p><span className="font-semibold">Type:</span> {pendingAppointment.appointmentType}</p>
              <p><span className="font-semibold">Date:</span> {pendingAppointment.date}</p>
            </div>
          ) : null
        }
        confirmLabel="Book appointment"
        onConfirm={confirmAppointment}
        onCancel={() => setPendingAppointment(null)}
      />
    </div>
  );
}
