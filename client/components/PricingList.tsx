"use client";

import { observer } from "mobx-react-lite";
import { Edit2 } from "lucide-react";
import { pricingStore } from "@/stores/pricingStore";
import type { PricingPlan } from "@/services/pricingService";

interface PricingListProps {
  onEdit: (plan: PricingPlan) => void;
}

function PricingListComponent({ onEdit }: PricingListProps) {
  const sortedPlans = [...pricingStore.plans].sort((a, b) => b.price - a.price);

  if (sortedPlans.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-surface-border p-6 text-sm text-text-muted">
        No pricing plans found.
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <h2 className="text-sm font-semibold text-text-primary">Pricing History</h2>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-background">
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">Name</th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">Price</th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">Description</th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">Features</th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlans.map((plan, index) => (
              <tr
                key={plan.id}
                className={`border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors ${index === 0 ? "bg-card-green-light/30" : ""}`}
              >
                <td className="px-4 py-3 text-text-primary font-medium">{plan.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-bold ${index === 0 ? "text-card-green text-lg" : "text-text-primary"}`}
                  >
                    ${plan.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">{plan.description || "-"}</td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {plan.features?.length ? plan.features.join(", ") : "-"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onEdit(plan)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                  >
                    <Edit2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-surface-border">
        {sortedPlans.map((plan, index) => (
          <div
            key={plan.id}
            className={`p-4 space-y-2 ${index === 0 ? "bg-card-green-light/30" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{plan.name}</p>
                <span
                  className={`font-bold ${index === 0 ? "text-card-green text-lg" : "text-text-primary"}`}
                >
                  ${plan.price.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => onEdit(plan)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
              >
                <Edit2 size={15} />
              </button>
            </div>
            <p className="text-xs text-text-muted">{plan.description || "-"}</p>
            {plan.features?.length > 0 && (
              <p className="text-xs text-text-secondary">{plan.features.join(" • ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const PricingList = observer(PricingListComponent);
