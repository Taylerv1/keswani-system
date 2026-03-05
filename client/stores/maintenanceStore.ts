import { makeAutoObservable, runInAction } from "mobx";
import {
  createMaintenanceRequest,
  fetchMaintenanceRequestsPage,
  type CreateMaintenanceRequestPayload,
  type MaintenanceRequestsPage,
  type MaintenanceRequest,
} from "@/services/maintenanceService";

class MaintenanceStore {
  private static readonly PAGE_SIZE = 100;

  requests: MaintenanceRequest[] = [];
  loading = false;
  creating = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async fetchRequests() {
    this.loading = true;
    this.error = null;

    try {
      const firstPage = await fetchMaintenanceRequestsPage(
        1,
        MaintenanceStore.PAGE_SIZE
      );

      runInAction(() => {
        this.requests = firstPage.items;
        this.loading = false;
      });

      if (firstPage.totalPages > 1) {
        void this.hydrateRemainingPages(firstPage.totalPages);
      }
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch maintenance requests";
        this.loading = false;
      });
    }
  }

  private async hydrateRemainingPages(totalPages: number) {
    try {
      const pageRequests = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          fetchMaintenanceRequestsPage(index + 2, MaintenanceStore.PAGE_SIZE)
        )
      );

      runInAction(() => {
        const existingIds = new Set(this.requests.map((item) => item.id));
        const remaining = pageRequests
          .flatMap((page: MaintenanceRequestsPage) => page.items)
          .filter((item) => !existingIds.has(item.id));

        if (remaining.length > 0) {
          this.requests = [...this.requests, ...remaining];
        }
      });
    } catch {
      // Ignore background hydration errors to avoid blocking already-rendered data.
    }
  }

  addRequest(request: MaintenanceRequest) {
    this.requests = [request, ...this.requests];
  }

  async createRequest(data: CreateMaintenanceRequestPayload): Promise<boolean> {
    this.creating = true;
    this.error = null;

    try {
      const createdRequest = await createMaintenanceRequest(data);

      runInAction(() => {
        this.addRequest(createdRequest);
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to create maintenance request";
      });

      return false;
    } finally {
      runInAction(() => {
        this.creating = false;
      });
    }
  }
}

export const maintenanceStore = new MaintenanceStore();
