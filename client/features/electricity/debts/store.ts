import { makeAutoObservable, runInAction } from "mobx";
import { getElectricityDebts } from "./api";
import type { DebtSubscriberItem } from "./types";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class ElectricityDebtsStore {
  private loaded = false;
  private inFlight: Promise<void> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: DebtSubscriberItem[] = [];
  totalDebt = 0;
  totalUnpaidBills = 0;
  subscribersInDebt = 0;
  loading = false;
  error = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private clearFlashTimer() {
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
  }

  private scheduleFlashClear(durationMs = 3000) {
    const currentVersion = ++this.flashVersion;
    this.clearFlashTimer();

    this.flashTimer = setTimeout(() => {
      runInAction(() => {
        if (this.flashVersion !== currentVersion) return;
        this.error = "";
        this.flashTimer = null;
      });
    }, durationMs);
  }

  private showError(message: string) {
    this.error = message;
    this.scheduleFlashClear();
  }

  get observerSnapshot() {
    return {
      items: this.items,
      totalDebt: this.totalDebt,
      totalUnpaidBills: this.totalUnpaidBills,
      subscribersInDebt: this.subscribersInDebt,
      loading: this.loading,
      error: this.error,
      maxDebt: this.maxDebt,
    };
  }

  get maxDebt() {
    return this.items.length
      ? Math.max(...this.items.map((item) => item.total_debt), 1)
      : 1;
  }

  setError(message: string) {
    this.showError(message);
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await this.loadDebts({ errorFallback });
  }

  async loadDebts(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.loaded) {
      return;
    }

    if (!options.force && this.inFlight) {
      await this.inFlight;
      return;
    }

    const requestPromise = (async () => {
      try {
        this.loading = true;
        this.error = "";

        const response = await getElectricityDebts();
        runInAction(() => {
          this.items = response.data?.items ?? [];
          this.totalDebt = response.data?.summary.total_debt ?? 0;
          this.totalUnpaidBills = response.data?.summary.total_unpaid_bills ?? 0;
          this.subscribersInDebt = response.data?.summary.subscribers_in_debt ?? 0;
          this.loaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.items = [];
          this.totalDebt = 0;
          this.totalUnpaidBills = 0;
          this.subscribersInDebt = 0;
          this.loaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      } finally {
        runInAction(() => {
          this.loading = false;
        });
      }
    })();

    this.inFlight = requestPromise;
    try {
      await requestPromise;
    } finally {
      this.inFlight = null;
    }
  }
}

export const electricityDebtsStore = new ElectricityDebtsStore();
