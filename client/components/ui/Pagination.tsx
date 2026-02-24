"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/translation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const { t, dir } = useTranslation();

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1) return null;

  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
      <span>
        {t("showing")} {start}-{end} {t("of")} {totalItems} {t("results")}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
        >
          <PrevIcon size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm transition-colors cursor-pointer ${
              page === currentPage
                ? "bg-primary text-white border-primary"
                : "border-surface-border bg-surface hover:border-primary/40 hover:text-primary"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
        >
          <NextIcon size={14} />
        </button>
      </div>
    </div>
  );
}
