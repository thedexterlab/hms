interface DashboardStatCardProps {
  label: string;
  value: number | string;
  hint: string;
}

export function DashboardStatCard({ label, value, hint }: DashboardStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}
