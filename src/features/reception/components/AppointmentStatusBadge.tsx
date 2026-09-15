interface AppointmentStatusBadgeProps {
  status: string;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const styles: Record<string, string> = {
    Scheduled: 'bg-slate-100 text-slate-700',
    'Checked In': 'bg-emerald-100 text-emerald-700',
    Waiting: 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-red-100 text-red-700',
    'No Show': 'bg-rose-100 text-rose-700',
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
