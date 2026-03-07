"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Plus, Zap, DollarSign } from "lucide-react";
import { LoadingLottie, KpiCard } from "@/components/ui";
import { PricingList } from "@/components/PricingList";
import { PricingForm } from "@/components/PricingForm";
import { pricingStore } from "@/stores/pricingStore";
import type { PricingPlan } from "@/services/pricingService";

function PricingPageComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    void pricingStore.fetchPlans();
  }, []);

  const sortedPlans = [...pricingStore.plans].sort((a, b) => b.price - a.price);
  const currentPrice = sortedPlans[0];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pricing Management</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage pricing plans and keep plan changes in sync with the backend.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPlan(null);
            setModalOpen(true);
          }}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus size={16} />
          Add Pricing
        </button>
      </div>

      {pricingStore.error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pricingStore.error}
        </div>
      )}

      {pricingStore.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <>
          {currentPrice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <KpiCard
                label="Current Price / kWh"
                value={`$${currentPrice.price.toFixed(2)}`}
                icon={<Zap size={22} />}
                color="text-card-orange"
                bgColor="bg-card-orange-light"
              />
              <KpiCard
                label="Current Plan"
                value={currentPrice.name}
                icon={<DollarSign size={22} />}
                color="text-card-blue"
                bgColor="bg-card-blue-light"
              />
            </div>
          )}

          <PricingList onEdit={(plan) => {
            setEditingPlan(plan);
            setModalOpen(true);
          }} />
        </>
      )}

      <PricingForm
        key={`${editingPlan?.id ?? "new"}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        editingPlan={editingPlan}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
      />
    </div>
  );
}

export default observer(PricingPageComponent);
