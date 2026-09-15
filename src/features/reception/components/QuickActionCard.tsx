import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
}

function QuickActionContent({ title, description, icon }: Pick<QuickActionCardProps, 'title' | 'description' | 'icon'>) {
  return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
  );
}

export function QuickActionCard({ title, description, icon, to, onClick }: QuickActionCardProps) {
  const className = 'rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-200';

  if (to) {
    return (
      <Link to={to} className={className}>
        <QuickActionContent title={title} description={description} icon={icon} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <QuickActionContent title={title} description={description} icon={icon} />
    </button>
  );
}
