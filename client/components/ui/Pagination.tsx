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

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const getPageItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages] as const;
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      totalPages,
    ] as const;
  };

  const pageItems = getPageItems();

  return (
    <div className="mt-4 text-sm text-text-secondary">
      <div className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t("previous")}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
        >
          <PrevIcon size={14} />
        </button>
        {pageItems.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="min-w-8 h-8 px-2 rounded-lg flex items-center justify-center text-text-muted"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              aria-label={`${t("page")} ${item}`}
              aria-current={item === safeCurrentPage ? "page" : undefined}
              className={`min-w-8 h-8 px-2 rounded-lg flex items-center justify-center border text-sm transition-colors cursor-pointer ${
                item === safeCurrentPage
                  ? "bg-primary text-white border-primary"
                  : "border-surface-border bg-surface hover:border-primary/40 hover:text-primary"
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={t("next")}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
        >
          <NextIcon size={14} />
        </button>
      </div>
      <div className="mt-2 text-center text-xs sm:text-sm">
        {t("showing")} {start}-{end} {t("of")} {totalItems} {t("results")}
      </div>
    </div>
  );
}
