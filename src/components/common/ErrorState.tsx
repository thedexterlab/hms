import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Unable to load this information.', description = 'Please try again.', onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {title}
      </div>
      <p className="mt-2">{description}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white">
          Retry
        </button>
      ) : null}
    </div>
  );
}
