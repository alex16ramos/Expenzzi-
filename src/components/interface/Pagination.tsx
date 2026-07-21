import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize = 100,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 text-xs text-slate-400 shrink-0">
      <span>{pageSize} por página</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-slate-200 font-semibold">
          Página {currentPage} de {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
