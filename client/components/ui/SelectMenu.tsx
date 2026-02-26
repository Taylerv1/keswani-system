"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsLabel: string;
  addActionLabel?: string;
  onAddAction?: () => void;
}

export default function SelectMenu({
  value,
  options,
  onChange,
  placeholder = "--",
  searchable = false,
  searchPlaceholder = "Search...",
  noResultsLabel,
  addActionLabel,
  onAddAction,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;

    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open || !searchable) return;
    searchInputRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-between"
      >
        <span className="truncate text-start">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface shadow-lg">
          {searchable && (
            <div className="p-2 border-b border-surface-border">
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {onAddAction && addActionLabel && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onAddAction();
                  }}
                  className="mt-2 w-full h-8 rounded-md border border-surface-border bg-surface text-text-secondary hover:bg-background transition-colors text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  {addActionLabel}
                </button>
              )}
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-text-muted">{noResultsLabel}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-start px-3 py-2 text-sm cursor-pointer hover:bg-background ${
                    value === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

