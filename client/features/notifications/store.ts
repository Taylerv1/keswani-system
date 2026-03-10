import { makeAutoObservable, runInAction } from "mobx";
import {
  fetchNotifications,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  fetchNotificationStats,
} from "./api";
import type {
  NotificationItem,
  NotificationListResponse,
  TabFilter,
  ReadFilter,
  MaintenanceDetail,
  IssueDetail,
} from "./types";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class NotificationsStore {
  PAGE_SIZE = 10;
  private pageCache = new Map<
    string,
    {
      items: NotificationItem[];
      totalItems: number;
      totalPages: number;
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private entityCache = new Map<string, MaintenanceDetail | IssueDetail | null>();
  private inFlightEntities = new Map<string, Promise<void>>();
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: NotificationItem[] = [];
  tab: TabFilter = "all";
  filterRead: ReadFilter = "all";
  filterType = "all";
  search = "";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  unreadCount = 0;
  loading = false;
  actionLoading = false;
  entityLoading = false;
  entityDetail: MaintenanceDetail | IssueDetail | null = null;
  error = "";
  success = "";

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

  private invalidateCache() {
    this.pageCache.clear();
  }

  private buildCacheKey(page: number) {
    return JSON.stringify({
      page,
      limit: this.PAGE_SIZE,
      tab: this.tab,
      filterRead: this.filterRead,
      filterType: this.filterType,
      search: this.search || "",
    });
  }

  private get sectionParam(): string | undefined {
    return this.tab === "all" ? undefined : this.tab;
  }

  get observerSnapshot() {
    return {
      items: this.items,
      tab: this.tab,
      filterRead: this.filterRead,
      filterType: this.filterType,
      search: this.search,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      unreadCount: this.unreadCount,
      loading: this.loading,
      actionLoading: this.actionLoading,
      entityLoading: this.entityLoading,
      entityDetail: this.entityDetail,
      error: this.error,
      success: this.success,
    };
  }

  setTab(value: TabFilter) {
    this.tab = value;
    this.filterType = "all";
    this.page = 1;
  }

  setFilterRead(value: ReadFilter) {
    this.filterRead = value;
    this.page = 1;
  }

  setFilterType(value: string) {
    this.filterType = value;
    this.page = 1;
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  async loadEntityDetail(item: NotificationItem): Promise<void> {
    if (!item.relatedId) {
      runInAction(() => {
        this.entityDetail = null;
        this.entityLoading = false;
      });
      return;
    }

    const cacheKey = item.relatedId;

    // Cache hit: instant, no loading state
    if (this.entityCache.has(cacheKey)) {
      runInAction(() => {
        this.entityDetail = this.entityCache.get(cacheKey) ?? null;
        this.entityLoading = false;
      });
      return;
    }

    // Not cached: show loading, clear stale detail
    runInAction(() => {
      this.entityDetail = null;
      this.entityLoading = true;
    });

    // In-flight dedup
    const inFlight = this.inFlightEntities.get(cacheKey);
    if (inFlight) {
      await inFlight;
      runInAction(() => {
        this.entityDetail = this.entityCache.get(cacheKey) ?? null;
        this.entityLoading = false;
      });
      return;
    }

    const requestPromise = (async () => {
      try {
        let detail: MaintenanceDetail | IssueDetail | null = null;

        if (item.section === "rent") {
          const res = await fetch(`/api/maintenance/${item.relatedId}`, { cache: "no-store" });
          const data = await res.json() as { success: boolean; data?: MaintenanceDetail };
          detail = data.success && data.data ? data.data : null;
        } else if (item.section === "electricity") {
          const res = await fetch(`/api/electricity-issues/${item.relatedId}`, { cache: "no-store" });
          const data = await res.json() as { success: boolean; data?: IssueDetail };
          detail = data.success && data.data ? data.data : null;
        }

        runInAction(() => {
          this.entityCache.set(cacheKey, detail);
          this.entityDetail = detail;
        });
      } catch {
        runInAction(() => {
          this.entityCache.set(cacheKey, null);
          this.entityDetail = null;
        });
      } finally {
        runInAction(() => {
          this.entityLoading = false;
        });
      }
    })();

    this.inFlightEntities.set(cacheKey, requestPromise);
    try {
      await requestPromise;
    } finally {
      this.inFlightEntities.delete(cacheKey);
    }
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await Promise.all([
      this.loadNotifications({ errorFallback }),
      this.loadUnreadCount(),
    ]);
  }

  async loadUnreadCount(): Promise<void> {
    try {
      const res = await fetchNotificationStats();
      if (res.success && res.data) {
        runInAction(() => {
          this.unreadCount = res.data!.total_unread;
        });
      }
    } catch {
      // silent — badge is non-critical
    }
  }

  async loadNotifications(options: {
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

        const isReadParam =
          this.filterRead === "unread"
            ? "false"
            : this.filterRead === "read"
              ? "true"
              : undefined;

        const response = await fetchNotifications({
          section: this.sectionParam,
          type: this.filterType !== "all" ? this.filterType : undefined,
          is_read: isReadParam,
          search: this.search || undefined,
          page: currentPage,
          limit: this.PAGE_SIZE,
        });

        runInAction(() => {
          const data = response.data as NotificationListResponse | undefined;
          const items = data?.items ?? [];
          const totalItems = data?.pagination.total ?? 0;
          const totalPages = data?.pagination.total_pages ?? 1;

          this.page = currentPage;
          this.items = items;
          this.totalItems = totalItems;
          this.totalPages = totalPages;
          this.pageCache.set(cacheKey, {
            items,
            totalItems,
            totalPages,
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

  async markRead(
    id: string,
    options: { errorFallback: string }
  ): Promise<void> {
    try {
      await markNotificationReadApi(id);

      runInAction(() => {
        this.items = this.items.map((item) =>
          item.id === id ? { ...item, read: true } : item
        );
        this.invalidateCache();
        if (this.unreadCount > 0) this.unreadCount--;
      });
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
      });
    }
  }

  async markAllRead(options: {
    errorFallback: string;
    successMessage: string;
  }): Promise<void> {
    try {
      this.actionLoading = true;

      await markAllNotificationsReadApi(this.sectionParam);

      runInAction(() => {
        this.items = this.items.map((item) => ({ ...item, read: true }));
        this.invalidateCache();
        this.showSuccess(options.successMessage);
      });

      await this.loadUnreadCount();
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
      });
    } finally {
      runInAction(() => {
        this.actionLoading = false;
      });
    }
  }
}

export const notificationsStore = new NotificationsStore();
