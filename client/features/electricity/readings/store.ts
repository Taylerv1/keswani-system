import { makeAutoObservable, runInAction } from "mobx";
import type { SetStateAction } from "react";
import {
  createReading,
  generateReadingBill,
  getElectricityEmployees,
  getReadingMeters,
  getReadings,
} from "./api";
import type {
  CreateReadingInput,
  EmployeeLookupItem,
  MeterLookupItem,
  ReadingListItem,
} from "./types";

export interface ReadingFormState {
  meter_id: string;
  month: string;
  current_reading: number;
  recorded_by: string;
  notes: string;
}

const EMPTY_FORM: ReadingFormState = {
  meter_id: "",
  month: new Date().toISOString().slice(0, 7),
  current_reading: 0,
  recorded_by: "",
  notes: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class ReadingsStore {
  PAGE_SIZE = 8;
  private pageCache = new Map<
    string,
    {
      items: ReadingListItem[];
      totalItems: number;
      totalPages: number;
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private metersLoaded = false;
  private employeesLoaded = false;
  private inFlightMeters: Promise<void> | null = null;
  private inFlightEmployees: Promise<void> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: ReadingListItem[] = [];
  meterOptions: MeterLookupItem[] = [];
  employeeOptions: EmployeeLookupItem[] = [];
  search = "";
  monthFilter = "all";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  actionLoading = false;
  error = "";
  success = "";

  modalOpen = false;
  form: ReadingFormState = { ...EMPTY_FORM };

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
      month: this.monthFilter === "all" ? "" : this.monthFilter,
    });
  }

  get observerSnapshot() {
    return {
      items: this.items,
      meterOptions: this.meterOptions,
      employeeOptions: this.employeeOptions,
      search: this.search,
      monthFilter: this.monthFilter,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      actionLoading: this.actionLoading,
      error: this.error,
      success: this.success,
      modalOpen: this.modalOpen,
      form: this.form,
      selectedMeter: this.selectedMeter,
      previousReadingForForm: this.previousReadingForForm,
      consumptionForForm: this.consumptionForForm,
      availableMonths: this.availableMonths,
    };
  }

  get selectedMeter() {
    return this.meterOptions.find((item) => item.id === this.form.meter_id) ?? null;
  }

  get previousReadingForForm() {
    return this.selectedMeter?.last_reading_value ?? 0;
  }

  get consumptionForForm() {
    return Math.max(0, this.form.current_reading - this.previousReadingForForm);
  }

  get availableMonths() {
    const months = new Set(this.items.map((item) => item.month).filter(Boolean));
    return Array.from(months).sort().reverse();
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setMonthFilter(value: string) {
    this.monthFilter = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setForm(value: SetStateAction<ReadingFormState>) {
    this.form = typeof value === "function" ? value(this.form) : value;
  }

  setError(message: string) {
    this.showError(message);
  }

  openAdd() {
    this.form = { ...EMPTY_FORM };
    this.error = "";
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.form = { ...EMPTY_FORM };
    this.error = "";
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await Promise.all([
      this.loadReadings({ errorFallback }),
      this.loadMeters({ errorFallback }),
      this.loadEmployees({ errorFallback }),
    ]);
  }

  async loadMeters(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.metersLoaded) {
      return;
    }

    if (!options.force && this.inFlightMeters) {
      await this.inFlightMeters;
      return;
    }

    const requestPromise = (async () => {
      try {
        const items = await getReadingMeters();
        runInAction(() => {
          this.meterOptions = items;
          this.metersLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.meterOptions = [];
          this.metersLoaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      }
    })();

    this.inFlightMeters = requestPromise;

    try {
      await requestPromise;
    } finally {
      this.inFlightMeters = null;
    }
  }

  async loadEmployees(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.employeesLoaded) {
      return;
    }

    if (!options.force && this.inFlightEmployees) {
      await this.inFlightEmployees;
      return;
    }

    const requestPromise = (async () => {
      try {
        const items = await getElectricityEmployees();
        runInAction(() => {
          this.employeeOptions = items;
          this.employeesLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.employeeOptions = [];
          this.employeesLoaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      }
    })();

    this.inFlightEmployees = requestPromise;

    try {
      await requestPromise;
    } finally {
      this.inFlightEmployees = null;
    }
  }

  async loadReadings(options: {
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

        const response = await getReadings({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
          month: this.monthFilter === "all" ? undefined : this.monthFilter,
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
    meterRequiredMessage: string;
    readingValueRequiredMessage: string;
    readingValueTooLowMessage: string;
    createdSuccessMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    if (!this.form.meter_id) {
      this.showError(options.meterRequiredMessage);
      return false;
    }

    if (!Number.isFinite(this.form.current_reading) || this.form.current_reading <= 0) {
      this.showError(options.readingValueRequiredMessage);
      return false;
    }

    if (this.form.current_reading <= this.previousReadingForForm) {
      this.showError(options.readingValueTooLowMessage);
      return false;
    }

    try {
      this.actionLoading = true;
      this.error = "";

      const payload: CreateReadingInput = {
        meter_id: this.form.meter_id,
        reading_value: this.form.current_reading,
        reading_date: `${this.form.month}-15`,
        recorded_by: this.form.recorded_by || null,
        source: "manual",
        notes: this.form.notes.trim() || null,
      };

      await createReading(payload);

      runInAction(() => {
        this.closeModal();
        this.page = 1;
        this.invalidateCache();
        this.showSuccess(options.createdSuccessMessage);
      });

      await Promise.all([
        this.loadReadings({
          errorFallback: options.errorFallback,
          targetPage: 1,
          force: true,
        }),
        this.loadMeters({
          errorFallback: options.errorFallback,
          force: true,
        }),
      ]);

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

  async generateBillForReading(
    readingId: string,
    options: {
      successMessage: string;
      errorFallback: string;
    }
  ): Promise<boolean> {
    try {
      this.actionLoading = true;
      this.error = "";

      await generateReadingBill(readingId);

      runInAction(() => {
        this.items = this.items.map((item) =>
          item.id === readingId
            ? {
                ...item,
                bill_generated: true,
              }
            : item
        );
        this.showSuccess(options.successMessage);
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
}

export const readingsStore = new ReadingsStore();
