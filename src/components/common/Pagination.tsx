import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, lastPage, total, onPageChange }) => {
  if (lastPage <= 1) return null;

  return (
    <div className="pagination-bar">
      <span className="pagination-info">Cəmi {total}</span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Əvvəlki səhifə"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="pagination-page">
          Səhifə {currentPage} / {lastPage}
        </span>
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Növbəti səhifə"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
