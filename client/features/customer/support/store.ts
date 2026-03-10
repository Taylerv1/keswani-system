"use client";

import { makeAutoObservable, runInAction } from "mobx";
import {
  getCustomerMaintenanceRequests,
  createCustomerMaintenanceRequest,
  getCustomerElectricityIssues,
  createCustomerElectricityIssue,
} from "./api";
import type {
  SupportTab,
  CustomerMaintenanceItem,
  CustomerElectricityIssue,
} from "./types";

type SupportItem = CustomerMaintenanceItem | CustomerElectricityIssue;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

class SupportStore {
  PAGE_SIZE = 3;
  private pageCache = new Map<
    string,
    { items: SupportItem[]; totalItems: number; totalPages: number }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  tab: SupportTab = "rent";
  items: SupportItem[] = [];
  page = 1;
  search = "";
  statusFilter = "all";
  totalItems = 0;
  totalPages = 1;
  loading = false;
  creating = false;
  error = "";
  success = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /* ── Flash messages ── */

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
        this.success = "";
        this.flashTimer = null;
      });
    }, durationMs);
  }

  private showError(message: string) {
    this.error = message;
    this.success = "";
    this.scheduleFlashClear();
  }

  private showSuccess(message: string) {
    this.success = message;
    this.error = "";
    this.scheduleFlashClear();
  }

  /* ── Cache ── */

  private invalidateCache() {
    this.pageCache.clear();
  }

  private buildCacheKey(page: number) {
    return JSON.stringify({
      page,
      limit: this.PAGE_SIZE,
      tab: this.tab,
      search: this.search || "",
      statusFilter: this.statusFilter,
    });
  }

  /* ── Observer snapshot for useMobxRender ── */

  get observerSnapshot() {
    return {
      tab: this.tab,
      items: this.items,
      page: this.page,
      search: this.search,
      statusFilter: this.statusFilter,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      creating: this.creating,
      error: this.error,
      success: this.success,
    };
  }

  /* ── Setters ── */

  setTab(value: SupportTab) {
    this.tab = value;
    this.statusFilter = "all";
    this.search = "";
    this.page = 1;
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setStatusFilter(value: string) {
    this.statusFilter = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  /* ── Bootstrap ── */

  async bootstrap(errorFallback: string): Promise<void> {
    await this.loadItems({ errorFallback });
  }

  /* ── Load items ── */

  async loadItems(options: {
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
        this.loading = false;
      });
      return;
    }

    if (!options.force) {
      const inFlight = this.inFlightPages.get(cacheKey);
      if (inFlight) {
        await inFlight;
        const afterWait = this.pageCache.get(cacheKey);
        if (afterWait) {
          runInAction(() => {
            this.page = currentPage;
            this.error = "";
            this.items = afterWait.items;
            this.totalItems = afterWait.totalItems;
            this.totalPages = afterWait.totalPages;
            this.loading = false;
          });
          return;
        }
      }
    }

    const requestPromise = (async () => {
      try {
        this.loading = true;
        this.error = "";

        let items: SupportItem[] = [];
        let totalItems = 0;
        let totalPages = 1;

        if (this.tab === "rent") {
          const res = await getCustomerMaintenanceRequests({
            page: currentPage,
            limit: this.PAGE_SIZE,
            search: this.search || undefined,
            status:
              this.statusFilter !== "all"
                ? (this.statusFilter as "open" | "in_progress" | "completed" | "closed")
                : undefined,
          });
          items = res.data?.items ?? [];
          totalItems = res.data?.pagination.total ?? 0;
          totalPages = res.data?.pagination.total_pages ?? 1;
        } else {
          const res = await getCustomerElectricityIssues({
            page: currentPage,
            limit: this.PAGE_SIZE,
            search: this.search || undefined,
            status:
              this.statusFilter !== "all"
                ? (this.statusFilter as "open" | "in_progress" | "resolved" | "closed")
                : undefined,
          });
          items = res.data?.items ?? [];
          totalItems = res.data?.pagination.total ?? 0;
          totalPages = res.data?.pagination.total_pages ?? 1;
        }

        runInAction(() => {
          this.page = currentPage;
          this.items = items;
          this.totalItems = totalItems;
          this.totalPages = totalPages;
          this.pageCache.set(cacheKey, { items, totalItems, totalPages });
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

  /* ── Create request ── */

  async submitMaintenanceRequest(
    payload: { title: string; description: string; estimated_cost?: number },
    options: { errorFallback: string; successMessage: string },
  ): Promise<boolean> {
    try {
      this.creating = true;
      await createCustomerMaintenanceRequest(payload);

      runInAction(() => {
        this.showSuccess(options.successMessage);
        this.invalidateCache();
      });

      await this.loadItems({ errorFallback: options.errorFallback, force: true });
      return true;
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
      });
      return false;
    } finally {
      runInAction(() => {
        this.creating = false;
      });
    }
  }

  async submitElectricityIssue(
    payload: { title: string; description: string; category?: string },
    options: { errorFallback: string; successMessage: string },
  ): Promise<boolean> {
    try {
      this.creating = true;
      await createCustomerElectricityIssue(payload);

      runInAction(() => {
        this.showSuccess(options.successMessage);
        this.invalidateCache();
      });

      await this.loadItems({ errorFallback: options.errorFallback, force: true });
      return true;
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
      });
      return false;
    } finally {
      runInAction(() => {
        this.creating = false;
      });
    }
  }
}

export const supportStore = new SupportStore();
