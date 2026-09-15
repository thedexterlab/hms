import { ClipboardList, FilePlus2, Search, Users, Stethoscope, Printer, ArrowRightLeft, UserRoundPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DashboardStatCard } from '../components/DashboardStatCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { AppointmentStatusBadge } from '../components/AppointmentStatusBadge';
import { getAppointments, getDashboardSummary, getNotifications, getQueue } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';
import { EmptyState } from '../../../components/common/EmptyState';
import { Link } from 'react-router-dom';

export function ReceptionDashboardPage() {
  const { data: summary, isLoading, error, refetch } = useQuery({ queryKey: ['reception-dashboard'], queryFn: getDashboardSummary });
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({ queryKey: ['reception-appointments'], queryFn: getAppointments });
  const { data: queue = [], isLoading: queueLoading } = useQuery({ queryKey: ['reception-queue'], queryFn: getQueue });
  const { data: notifications = [] } = useQuery({ queryKey: ['reception-notifications'], queryFn: getNotifications });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Today’s registrations" value={summary?.registrationsToday ?? 0} hint="New admissions today" />
        <DashboardStatCard label="Today’s appointments" value={summary?.appointmentsToday ?? 0} hint="Scheduled and walk-ins" />
        <DashboardStatCard label="Patients waiting" value={summary?.waitingPatients ?? 0} hint="In queue" />
        <DashboardStatCard label="Checked-in patients" value={summary?.checkedInPatients ?? 0} hint="Ready for consultation" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
              <p className="text-sm text-slate-500">Common receptionist workflows</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickActionCard title="Register New Patient" description="Create a new patient record" icon={<UserRoundPlus className="h-5 w-5" />} to="/reception/patients/new" />
            <QuickActionCard title="Search Patient" description="Find existing records quickly" icon={<Search className="h-5 w-5" />} to="/reception/patients" />
            <QuickActionCard title="Book Appointment" description="Assign a department and doctor" icon={<ClipboardList className="h-5 w-5" />} to="/reception/appointments/new" />
            <QuickActionCard title="Open Queue" description="Review current OPD waitlist" icon={<Users className="h-5 w-5" />} to="/reception/queue" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Operational alerts</h2>
          <div className="mt-4 space-y-3">
            {notifications.length ? notifications.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">{alert.title}</p>
                <p className="mt-1">{alert.detail}</p>
              </div>
            )) : <EmptyState title="No alerts" description="The queue and scheduling feed are clear right now." />}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Today’s appointments</h2>
              <p className="text-sm text-slate-500">Reception oversight for the current day</p>
            </div>
            <Link to="/reception/appointments" className="text-sm font-semibold text-teal-700">View all</Link>
          </div>

          {appointmentsLoading ? <LoadingSkeleton rows={4} /> : appointments.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">Token</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Doctor</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-semibold">#{appointment.tokenNumber}</td>
                      <td className="px-3 py-3">{appointment.appointmentTime}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800">{appointment.patientName}</p>
                        <p className="text-xs text-slate-500">{appointment.mrn}</p>
                      </td>
                      <td className="px-3 py-3">{appointment.doctor}</td>
                      <td className="px-3 py-3"><AppointmentStatusBadge status={appointment.status} /></td>
                      <td className="px-3 py-3">{appointment.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No appointments" description="No appointments are scheduled for the selected day." />}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Queue preview</h2>
              <p className="text-sm text-slate-500">Current OPD wait status</p>
            </div>
            <Link to="/reception/queue" className="text-sm font-semibold text-teal-700">Manage</Link>
          </div>

          {queueLoading ? <LoadingSkeleton rows={4} /> : queue.length ? (
            <div className="mt-4 space-y-3">
              {queue.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{entry.doctor}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{entry.priority}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Current token #{entry.tokenNumber}</span>
                    <span>{entry.waitingDuration}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {entry.patientName} • {entry.mrn}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Queue is clear" description="No patients waiting at the moment." />}
        </div>
      </div>
    </div>
  );
}
