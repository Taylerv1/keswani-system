import { makeAutoObservable, runInAction } from "mobx";
import { getElectricityBuildings, type ElectricityBuildingItem } from "./api";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class BuildingsStore {
  PAGE_SIZE = 6;

  private pageCache = new Map<
    string,
    {
      items: ElectricityBuildingItem[];
      totalItems: number;
      totalPages: number;
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();

  items: ElectricityBuildingItem[] = [];
  search = "";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  error = "";
  detailItem: ElectricityBuildingItem | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private buildCacheKey(page: number) {
    return JSON.stringify({
      page,
      limit: this.PAGE_SIZE,
      search: this.search || "",
    });
  }

  // Used by component-level autorun hook to subscribe to store changes.
  get observerSnapshot() {
    return {
      items: this.items,
      search: this.search,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      error: this.error,
      detailItem: this.detailItem,
    };
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setDetailItem(value: ElectricityBuildingItem | null) {
    this.detailItem = value;
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await this.loadBuildings({ errorFallback });
  }

  async loadBuildings(options: {
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

        const response = await getElectricityBuildings({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
        });

        runInAction(() => {
          const items = response.data?.items ?? [];
          const totalItems = response.data?.pagination.total ?? 0;
          const totalPages = Math.max(
            1,
            response.data?.pagination.total_pages ?? 1
          );

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
          this.error = getErrorMessage(error, options.errorFallback);
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
}

export const buildingsStore = new BuildingsStore();
