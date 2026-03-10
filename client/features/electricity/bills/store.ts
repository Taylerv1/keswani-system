import { makeAutoObservable, runInAction } from "mobx";
import { getBillById, getBills } from "./api";
import type { BillDetailItem, BillListItem } from "./types";

export type BillStatusFilter =
  | "all"
  | "open"
  | "pending"
  | "partial"
  | "overdue"
  | "paid"
  | "cancelled";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class BillsStore {
  PAGE_SIZE = 8;
  private pageCache = new Map<
    string,
    {
      items: BillListItem[];
      totalItems: number;
      totalPages: number;
      availableMonths: string[];
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private detailCache = new Map<string, BillDetailItem>();
  private detailInFlight = new Map<string, Promise<void>>();
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: BillListItem[] = [];
  availableMonths: string[] = [];
  search = "";
  filterStatus: BillStatusFilter = "all";
  filterMonth = "all";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  error = "";

  detailOpen = false;
  detailLoading = false;
  detailBill: BillDetailItem | null = null;

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

  private invalidateCache() {
    this.pageCache.clear();
  }

  private buildCacheKey(page: number) {
    return JSON.stringify({
      page,
      limit: this.PAGE_SIZE,
      search: this.search || "",
      status: this.filterStatus === "all" ? "" : this.filterStatus,
      month: this.filterMonth === "all" ? "" : this.filterMonth,
    });
  }

  get observerSnapshot() {
    return {
      items: this.items,
      availableMonths: this.availableMonths,
      search: this.search,
      filterStatus: this.filterStatus,
      filterMonth: this.filterMonth,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      error: this.error,
      detailOpen: this.detailOpen,
      detailLoading: this.detailLoading,
      detailBill: this.detailBill,
    };
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setFilterStatus(value: BillStatusFilter) {
    this.filterStatus = value;
    this.page = 1;
  }

  setFilterMonth(value: string) {
    this.filterMonth = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setError(message: string) {
    this.showError(message);
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await this.loadBills({ errorFallback });
  }

  async loadBills(options: {
    errorFallback: string;
    targetPage?: number;
    force?: boolean;
  }): Promise<void> {
    const currentPage = options.targetPage ?? this.page;
    const cacheKey = this.buildCacheKey(currentPage);
    const cached = this.pageCache.get(cacheKey);

    if (!options.force && cached) {
      runInAction(() => {
        this.page = currentPage;
        this.error = "";
        this.items = cached.items;
        this.totalItems = cached.totalItems;
        this.totalPages = cached.totalPages;
        this.availableMonths = cached.availableMonths;
        this.loading = false;
      });
      return;
    }

    if (!options.force) {
      const inFlight = this.inFlightPages.get(cacheKey);
      if (inFlight) {
        await inFlight;
        return;
      }
    }

    const requestPromise = (async () => {
      try {
        this.loading = true;
        this.error = "";

        const response = await getBills({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
          status: this.filterStatus === "all" ? undefined : this.filterStatus,
          month: this.filterMonth === "all" ? undefined : this.filterMonth,
        });

        runInAction(() => {
          const items = response.data?.items ?? [];
          const totalItems = response.data?.pagination.total ?? 0;
          const totalPages = response.data?.pagination.total_pages ?? 1;
          const availableMonths = response.data?.meta?.available_months ?? [];

          this.page = currentPage;
          this.items = items;
          this.totalItems = totalItems;
          this.totalPages = totalPages;
          this.availableMonths = availableMonths;
          this.pageCache.set(cacheKey, {
            items,
            totalItems,
            totalPages,
            availableMonths,
          });
        });
      } catch (error) {
        runInAction(() => {
          this.showError(getErrorMessage(error, options.errorFallback));
          this.items = [];
          this.totalItems = 0;
          this.totalPages = 1;
        });
      } finally {
        runInAction(() => {
          this.loading = false;
        });
      }
    })();

    this.inFlightPages.set(cacheKey, requestPromise);

    try {
      await requestPromise;
    } finally {
      this.inFlightPages.delete(cacheKey);
    }
  }

  async openDetail(billId: string, errorFallback: string): Promise<void> {
    this.detailOpen = true;
    this.detailBill = null;
    this.detailLoading = true;
    this.error = "";

    const cached = this.detailCache.get(billId);
    if (cached) {
      runInAction(() => {
        this.detailBill = cached;
        this.detailLoading = false;
      });
      return;
    }

    const inFlight = this.detailInFlight.get(billId);
    if (inFlight) {
      await inFlight;
      runInAction(() => {
        this.detailBill = this.detailCache.get(billId) ?? null;
        this.detailLoading = false;
      });
      return;
    }

    const requestPromise = (async () => {
      try {
        const response = await getBillById(billId);
        const detail = response.data ?? null;
        if (!detail) {
          throw new Error("Bill details not found");
        }

        runInAction(() => {
          this.detailCache.set(billId, detail);
          this.detailBill = detail;
        });
      } catch (error) {
        runInAction(() => {
          this.showError(getErrorMessage(error, errorFallback));
          this.detailOpen = false;
          this.detailBill = null;
        });
      } finally {
        runInAction(() => {
          this.detailLoading = false;
        });
      }
    })();

    this.detailInFlight.set(billId, requestPromise);

    try {
      await requestPromise;
    } finally {
      this.detailInFlight.delete(billId);
    }
  }

  closeDetail() {
    this.detailOpen = false;
    this.detailLoading = false;
    this.detailBill = null;
  }

  refreshDetailFromListItem(updatedItem: BillListItem) {
    const cached = this.detailCache.get(updatedItem.id);
    if (!cached) return;

    this.detailCache.set(updatedItem.id, {
      ...cached,
      ...updatedItem,
    });

    if (this.detailBill?.id === updatedItem.id) {
      this.detailBill = {
        ...this.detailBill,
        ...updatedItem,
      };
    }
  }

  clearListCache() {
    this.invalidateCache();
  }
}

export const billsStore = new BillsStore();
