interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Previous
        </button>
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Next
        </button>
      </div>
    </div>
  );
}
