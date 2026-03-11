import { makeAutoObservable, runInAction } from "mobx";
import type { SetStateAction } from "react";
import {
  createMeter,
  deleteMeter,
  getMeterSubscribers,
  getMeters,
  updateMeter,
} from "./api";
import type {
  CreateMeterInput,
  MeterListItem,
  SubscriberLookupItem,
  UpdateMeterInput,
} from "./types";
import { isShallowDirty } from "@/lib/formDirty";

export type MeterStatusFilter = "all" | "active" | "inactive";
export type MeterTypeFilter = "all" | "residential" | "commercial";

export interface MeterFormState {
  subscriber_id: string;
  meter_number: string;
  meter_type: "residential" | "commercial";
  status: "active" | "inactive";
  installation_date: string;
}

const EMPTY_FORM: MeterFormState = {
  subscriber_id: "",
  meter_number: "",
  meter_type: "residential",
  status: "active",
  installation_date: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class MetersStore {
  PAGE_SIZE = 8;
  private pageCache = new Map<
    string,
    {
      items: MeterListItem[];
      totalItems: number;
      totalPages: number;
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private subscribersLoaded = false;
  private inFlightSubscribers: Promise<void> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: MeterListItem[] = [];
  subscriberOptions: SubscriberLookupItem[] = [];
  search = "";
  filterStatus: MeterStatusFilter = "all";
  filterType: MeterTypeFilter = "all";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  actionLoading = false;
  error = "";
  success = "";

  modalOpen = false;
  editItem: MeterListItem | null = null;
  deleteId: string | null = null;
  form: MeterFormState = { ...EMPTY_FORM };
  private initialForm: MeterFormState = { ...EMPTY_FORM };

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
      search: this.search || "",
      status: this.filterStatus === "all" ? "" : this.filterStatus,
      meter_type: this.filterType === "all" ? "" : this.filterType,
    });
  }

  get observerSnapshot() {
    return {
      items: this.items,
      subscriberOptions: this.subscriberOptions,
      search: this.search,
      filterStatus: this.filterStatus,
      filterType: this.filterType,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      actionLoading: this.actionLoading,
      error: this.error,
      success: this.success,
      modalOpen: this.modalOpen,
      editItem: this.editItem,
      deleteId: this.deleteId,
      form: this.form,
    };
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setFilterStatus(value: MeterStatusFilter) {
    this.filterStatus = value;
    this.page = 1;
  }

  setFilterType(value: MeterTypeFilter) {
    this.filterType = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setDeleteId(value: string | null) {
    this.deleteId = value;
  }

  setForm(value: SetStateAction<MeterFormState>) {
    this.form = typeof value === "function" ? value(this.form) : value;
  }

  setError(message: string) {
    this.showError(message);
  }

  get isEditDirty() {
    if (!this.editItem) return true;
    return isShallowDirty(this.initialForm, this.form, [
      "subscriber_id",
      "meter_number",
      "meter_type",
      "status",
      "installation_date",
    ]);
  }

  openAdd() {
    this.editItem = null;
    this.form = { ...EMPTY_FORM };
    this.initialForm = { ...EMPTY_FORM };
    this.error = "";
    this.modalOpen = true;
  }

  openEdit(item: MeterListItem) {
    this.editItem = item;
    this.form = {
      subscriber_id: item.subscriber.id,
      meter_number: item.meter_number,
      meter_type: item.meter_type,
      status: item.status,
      installation_date: item.installation_date ?? "",
    };
    this.initialForm = { ...this.form };
    this.error = "";
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editItem = null;
    this.form = { ...EMPTY_FORM };
    this.initialForm = { ...EMPTY_FORM };
    this.error = "";
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await Promise.all([
      this.loadMeters({ errorFallback }),
      this.loadSubscribers({ errorFallback }),
    ]);
  }

  async loadSubscribers(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.subscribersLoaded) {
      return;
    }

    if (!options.force && this.inFlightSubscribers) {
      await this.inFlightSubscribers;
      return;
    }

    const requestPromise = (async () => {
      try {
        const items = await getMeterSubscribers();
        runInAction(() => {
          this.subscriberOptions = items;
          this.subscribersLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.subscriberOptions = [];
          this.subscribersLoaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      }
    })();

    this.inFlightSubscribers = requestPromise;

    try {
      await requestPromise;
    } finally {
      this.inFlightSubscribers = null;
    }
  }

  async loadMeters(options: {
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

        const response = await getMeters({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
          status: this.filterStatus === "all" ? undefined : this.filterStatus,
          meter_type: this.filterType === "all" ? undefined : this.filterType,
        });

        runInAction(() => {
          const items = response.data?.items ?? [];
          const totalItems = response.data?.pagination.total ?? 0;
          const totalPages = response.data?.pagination.total_pages ?? 1;

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

  async save(options: {
    meterNumberRequiredMessage: string;
    subscriberRequiredMessage: string;
    createdSuccessMessage: string;
    updatedSuccessMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    const meterNumber = this.form.meter_number.trim();

    if (!this.form.subscriber_id) {
      this.showError(options.subscriberRequiredMessage);
      return false;
    }

    if (!meterNumber) {
      this.showError(options.meterNumberRequiredMessage);
      return false;
    }

    try {
      this.actionLoading = true;
      this.error = "";

      if (this.editItem) {
        const payload: UpdateMeterInput = {
          subscriber_id: this.form.subscriber_id,
          meter_number: meterNumber,
          meter_type: this.form.meter_type,
          status: this.form.status,
          installation_date: this.form.installation_date || null,
        };

        await updateMeter(this.editItem.id, payload);
      } else {
        const payload: CreateMeterInput = {
          subscriber_id: this.form.subscriber_id,
          meter_number: meterNumber,
          meter_type: this.form.meter_type,
          status: this.form.status,
          installation_date: this.form.installation_date || null,
        };

        await createMeter(payload);
      }

      runInAction(() => {
        const targetPage = this.editItem ? this.page : 1;
        const successMessage = this.editItem
          ? options.updatedSuccessMessage
          : options.createdSuccessMessage;

        this.closeModal();
        this.page = targetPage;
        this.invalidateCache();
        this.showSuccess(successMessage);
      });

      await this.loadMeters({
        errorFallback: options.errorFallback,
        targetPage: this.page,
        force: true,
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
      });
      return false;
    } finally {
      runInAction(() => {
        this.actionLoading = false;
      });
    }
  }

  async removeSelected(options: {
    errorFallback: string;
    successMessage: string;
  }): Promise<boolean> {
    if (!this.deleteId) return false;
    const targetDeleteId = this.deleteId;

    try {
      this.actionLoading = true;
      this.error = "";

      await deleteMeter(targetDeleteId);

      const nextItems = this.items.filter((item) => item.id !== targetDeleteId);
      const nextTotalItems = Math.max(0, this.totalItems - 1);
      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextTotalItems / this.PAGE_SIZE)
      );
      const nextPage = Math.min(this.page, nextTotalPages);

      runInAction(() => {
        this.deleteId = null;
        this.invalidateCache();
        this.items = nextItems;
        this.totalItems = nextTotalItems;
        this.totalPages = nextTotalPages;
        this.page = nextPage;
        this.showSuccess(options.successMessage);
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.deleteId = null;
        this.showError(getErrorMessage(error, options.errorFallback));
      });
      return false;
    } finally {
      runInAction(() => {
        this.actionLoading = false;
      });
    }
  }
}

export const metersStore = new MetersStore();
