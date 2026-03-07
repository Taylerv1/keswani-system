import { makeAutoObservable, runInAction } from "mobx";
import {
  createPricingPlan,
  getPricingPlans,
  updatePricingPlan,
  type PricingPlan,
  type PricingPlanPayload,
} from "@/services/pricingService";

class PricingStore {
  plans: PricingPlan[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async fetchPlans() {
    this.loading = true;
    this.error = null;

    try {
      const plans = await getPricingPlans();
      runInAction(() => {
        this.plans = plans;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch pricing plans";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createPlan(data: PricingPlanPayload): Promise<PricingPlan | null> {
    this.error = null;

    try {
      const createdPlan = await createPricingPlan(data);

      runInAction(() => {
        if (createdPlan) {
          this.addPlan(createdPlan);
        }
      });

      return createdPlan;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to create pricing plan";
      });
      return null;
    }
  }

  async updatePlan(id: string, data: PricingPlanPayload): Promise<PricingPlan | null> {
    this.error = null;

    try {
      const updatedPlan = await updatePricingPlan(id, data);

      runInAction(() => {
        if (updatedPlan) {
          this.updatePlanInList(updatedPlan);
        }
      });

      return updatedPlan;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to update pricing plan";
      });
      return null;
    }
  }

  addPlan(plan: PricingPlan) {
    const exists = this.plans.some((item) => item.id === plan.id);
    if (!exists) {
      this.plans = [plan, ...this.plans];
    }
  }

  updatePlanInList(updatedPlan: PricingPlan) {
    this.plans = this.plans.map((plan) =>
      plan.id === updatedPlan.id ? updatedPlan : plan
    );
  }
}

export const pricingStore = new PricingStore();
