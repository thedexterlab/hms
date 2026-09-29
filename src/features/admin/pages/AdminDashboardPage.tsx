import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, CalendarDays, Activity, Wallet, Ban, Package, FlaskConical, Pill, ShieldAlert } from 'lucide-react';
import { getOverview } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin-overview'], queryFn: getOverview });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !data) return <ErrorState onRetry={() => refetch()} />;

  const cards = [
    { label: 'Total Patients', value: data.totalPatients, icon: Users, tone: 'bg-teal-50 text-teal-700' },
    { label: 'Registrations Today', value: data.registrationsToday, icon: UserPlus, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Appointments Today', value: data.appointmentsToday, icon: CalendarDays, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Active Visits Now', value: data.activeVisits, icon: Activity, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Revenue Today', value: `Rs. ${data.revenueToday.toLocaleString()}`, icon: Wallet, tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Pending Payments', value: data.pendingPayments, icon: Ban, tone: 'bg-rose-50 text-rose-700' },
    { label: 'Cancelled Today', value: data.cancelledToday, icon: Ban, tone: 'bg-rose-50 text-rose-700' },
    { label: 'Low Stock Items', value: data.lowStockItems, icon: Package, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Pending Lab Orders', value: data.pendingLabs, icon: FlaskConical, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Pending Prescriptions', value: data.pendingPrescriptions, icon: Pill, tone: 'bg-teal-50 text-teal-700' },
    { label: 'Staff Accounts', value: `${data.activeStaff}/${data.totalStaff} active`, icon: Users, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Locked Accounts', value: data.lockedAccounts, icon: ShieldAlert, tone: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Hospital overview</h2>
        <p className="text-sm text-slate-500">Live operational snapshot across reception, doctors, pharmacy and billing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`rounded-xl p-3 ${card.tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-xl font-semibold text-slate-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Staff by role</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(data.staffByRole).map(([role, count]) => (
            <span key={role} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              {role}: <span className="font-semibold text-teal-700">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
