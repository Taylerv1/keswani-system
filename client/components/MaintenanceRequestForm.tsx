"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { LoadingLottie } from "@/components/ui";

interface MaintenanceRequestFormProps {
  loading: boolean;
  submitted: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    estimated_cost?: number;
  }) => Promise<boolean>;
  onSubmittedShown: () => void;
  t: (key: string) => string;
}

export function MaintenanceRequestForm({
  loading,
  submitted,
  onSubmit,
  onSubmittedShown,
  t,
}: MaintenanceRequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const parseEstimatedCost = (input: string): number | undefined => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    const latinized = trimmed
      .replace(/[\u0660-\u0669]/g, (digit) =>
        String(digit.charCodeAt(0) - 0x0660)
      )
      .replace(/[\u06F0-\u06F9]/g, (digit) =>
        String(digit.charCodeAt(0) - 0x06f0)
      );

    let normalized = latinized
      .replace(/[^0-9.,+\-\u066B\u066C]/g, "")
      .replace(/\u066B/g, ".")
      .replace(/\u066C/g, ",");

    const hasDot = normalized.includes(".");
    const hasComma = normalized.includes(",");

    if (hasDot && hasComma) {
      normalized = normalized.replace(/,/g, "");
    } else if (!hasDot && hasComma) {
      normalized = normalized.replace(/,/g, ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return Number.NaN;
    return parsed;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) return;

    const parsedCost = parseEstimatedCost(estimatedCost);
    if (parsedCost !== undefined && Number.isNaN(parsedCost)) return;

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      estimated_cost: parsedCost,
    });

    if (success) {
      setTitle("");
      setDescription("");
      setEstimatedCost("");
      window.setTimeout(() => {
        onSubmittedShown();
      }, 2500);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {t("custCreateMaintenanceRequest")}
      </h3>

      {submitted && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-green-light text-card-green text-sm font-medium">
          {t("custMaintenanceSubmitted")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("maintenanceTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("custMaintenanceTitlePlaceholder")}
            required
            className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("description")}
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("custMaintenanceDescPlaceholder")}
            required
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("maintenanceCost")}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={estimatedCost}
            onChange={(event) => setEstimatedCost(event.target.value)}
            placeholder={t("custMaintenanceCostPlaceholder")}
            className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
          className="w-full h-11 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer border-0 flex items-center justify-center gap-2"
        >
          {loading ? (
            <LoadingLottie size={28} />
          ) : (
            <>
              <Send size={16} />
              {t("custSubmitMaintenanceRequest")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
