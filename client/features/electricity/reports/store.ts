import { makeAutoObservable, runInAction } from "mobx";
import { getElectricityReports } from "./api";
import type {
  BuildingBreakdownItem,
  ConsumptionByMonthItem,
  ElectricityReportType,
  RevenueByMonthItem,
  SubscriberBreakdownItem,
} from "./types";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class ElectricityReportsStore {
  private cache = new Map<
    string,
    {
      fromMonth: string;
      toMonth: string;
      totalConsumption: number;
      totalBilled: number;
      totalPaid: number;
      totalOutstanding: number;
      collectionRate: number;
      consumptionByMonth: ConsumptionByMonthItem[];
      revenueByMonth: RevenueByMonthItem[];
      buildingBreakdown: BuildingBreakdownItem[];
      subscriberBreakdown: SubscriberBreakdownItem[];
    }
  >();
  private inFlight = new Map<string, Promise<void>>();
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  reportType: ElectricityReportType = "consumption";
  fromMonth = "";
  toMonth = "";
  totalConsumption = 0;
  totalBilled = 0;
  totalPaid = 0;
  totalOutstanding = 0;
  collectionRate = 0;
  consumptionByMonth: ConsumptionByMonthItem[] = [];
  revenueByMonth: RevenueByMonthItem[] = [];
  buildingBreakdown: BuildingBreakdownItem[] = [];
  subscriberBreakdown: SubscriberBreakdownItem[] = [];
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

  private applyPayload(payload: {
    fromMonth: string;
    toMonth: string;
    totalConsumption: number;
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
    consumptionByMonth: ConsumptionByMonthItem[];
    revenueByMonth: RevenueByMonthItem[];
    buildingBreakdown: BuildingBreakdownItem[];
    subscriberBreakdown: SubscriberBreakdownItem[];
  }) {
    this.fromMonth = payload.fromMonth;
    this.toMonth = payload.toMonth;
    this.totalConsumption = payload.totalConsumption;
    this.totalBilled = payload.totalBilled;
    this.totalPaid = payload.totalPaid;
    this.totalOutstanding = payload.totalOutstanding;
    this.collectionRate = payload.collectionRate;
    this.consumptionByMonth = payload.consumptionByMonth;
    this.revenueByMonth = payload.revenueByMonth;
    this.buildingBreakdown = payload.buildingBreakdown;
    this.subscriberBreakdown = payload.subscriberBreakdown;
  }

  private buildCacheKey(fromMonth: string, toMonth: string) {
    return `${fromMonth}|${toMonth}`;
  }

  get observerSnapshot() {
    return {
      reportType: this.reportType,
      fromMonth: this.fromMonth,
      toMonth: this.toMonth,
      totalConsumption: this.totalConsumption,
      totalBilled: this.totalBilled,
      totalPaid: this.totalPaid,
      totalOutstanding: this.totalOutstanding,
      collectionRate: this.collectionRate,
      consumptionByMonth: this.consumptionByMonth,
      revenueByMonth: this.revenueByMonth,
      buildingBreakdown: this.buildingBreakdown,
      subscriberBreakdown: this.subscriberBreakdown,
      loading: this.loading,
      error: this.error,
      maxConsumption: this.maxConsumption,
      maxRevenue: this.maxRevenue,
    };
  }

  get maxConsumption() {
    return Math.max(
      ...this.consumptionByMonth.map((item) => item.consumption_kwh),
      1
    );
  }

  get maxRevenue() {
    return Math.max(
      ...this.revenueByMonth.map((item) =>
        Math.max(item.billed_amount, item.collected_amount)
      ),
      1
    );
  }

  setReportType(value: ElectricityReportType) {
    this.reportType = value;
  }

  setFromMonth(value: string) {
    this.fromMonth = value;
  }

  setToMonth(value: string) {
    this.toMonth = value;
  }

  setError(message: string) {
    this.showError(message);
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await this.loadReports({ errorFallback });
  }

  async loadReports(options: {
    errorFallback: string;
    force?: boolean;
    fromMonth?: string;
    toMonth?: string;
  }): Promise<void> {
    const fromMonth = options.fromMonth ?? this.fromMonth;
    const toMonth = options.toMonth ?? this.toMonth;
    const cacheKey = this.buildCacheKey(fromMonth, toMonth);
    const cached = this.cache.get(cacheKey);

    if (!options.force && cached) {
      runInAction(() => {
        this.error = "";
        this.applyPayload(cached);
        this.loading = false;
      });
      return;
    }

    if (!options.force) {
      const inFlight = this.inFlight.get(cacheKey);
      if (inFlight) {
        await inFlight;
        return;
      }
    }

    const requestPromise = (async () => {
      try {
        this.loading = true;
        this.error = "";

        const response = await getElectricityReports({
          from_month: fromMonth || undefined,
          to_month: toMonth || undefined,
        });
        const data = response.data;
        if (!data) {
          throw new Error("No report data returned");
        }

        const payload = {
          fromMonth: data.range.from_month ?? "",
          toMonth: data.range.to_month ?? "",
          totalConsumption: data.summary.total_consumption ?? 0,
          totalBilled: data.summary.total_billed ?? 0,
          totalPaid: data.summary.total_paid ?? 0,
          totalOutstanding: data.summary.total_outstanding ?? 0,
          collectionRate: data.summary.collection_rate ?? 0,
          consumptionByMonth: data.consumption_by_month ?? [],
          revenueByMonth: data.revenue_by_month ?? [],
          buildingBreakdown: data.building_breakdown ?? [],
          subscriberBreakdown: data.subscriber_breakdown ?? [],
        };

        runInAction(() => {
          this.applyPayload(payload);
          this.cache.set(this.buildCacheKey(payload.fromMonth, payload.toMonth), payload);
        });
      } catch (error) {
        runInAction(() => {
          this.showError(getErrorMessage(error, options.errorFallback));
          this.totalConsumption = 0;
          this.totalBilled = 0;
          this.totalPaid = 0;
          this.totalOutstanding = 0;
          this.collectionRate = 0;
          this.consumptionByMonth = [];
          this.revenueByMonth = [];
          this.buildingBreakdown = [];
          this.subscriberBreakdown = [];
        });
      } finally {
        runInAction(() => {
          this.loading = false;
        });
      }
    })();

    this.inFlight.set(cacheKey, requestPromise);
    try {
      await requestPromise;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }
}

export const electricityReportsStore = new ElectricityReportsStore();
