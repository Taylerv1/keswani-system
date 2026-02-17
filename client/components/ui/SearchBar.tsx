"use client";

import { Search, X } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const { t, dir } = useTranslation();

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute top-1/2 -translate-y-1/2 text-text-muted"
        style={{ [dir === "rtl" ? "right" : "left"]: "12px" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("search")}
        className="h-10 w-full rounded-lg border border-surface-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        style={{
          [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px",
          [dir === "rtl" ? "paddingLeft" : "paddingRight"]: value ? "36px" : "12px",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-0"
          style={{ [dir === "rtl" ? "left" : "right"]: "12px" }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
