import { makeAutoObservable, runInAction } from "mobx";
import type { SetStateAction } from "react";
import {
  createElectricityPayment,
  getElectricityCollectors,
  getElectricityPayments,
  getOpenBills,
  getPaymentSubscribers,
} from "./api";
import type {
  CollectorLookupItem,
  ElectricityPaymentItem,
  ElectricitySubscriberLookupItem,
  OpenBillLookupItem,
} from "./types";
import { billsStore } from "../bills/store";

export interface ElectricityPaymentFormState {
  subscriber_id: string;
  bill_id: string;
  amount: number;
  collected_by: string;
}

const EMPTY_FORM: ElectricityPaymentFormState = {
  subscriber_id: "",
  bill_id: "",
  amount: 0,
  collected_by: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class ElectricityPaymentsStore {
  PAGE_SIZE = 8;
  private pageCache = new Map<
    string,
    {
      items: ElectricityPaymentItem[];
      totalItems: number;
      totalPages: number;
      totalCollected: number;
      totalPayments: number;
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private subscribersLoaded = false;
  private collectorsLoaded = false;
  private inFlightSubscribers: Promise<void> | null = null;
  private inFlightCollectors: Promise<void> | null = null;
  private openBillsCache = new Map<string, OpenBillLookupItem[]>();
  private inFlightOpenBills = new Map<string, Promise<void>>();
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: ElectricityPaymentItem[] = [];
  subscriberOptions: ElectricitySubscriberLookupItem[] = [];
  collectorOptions: CollectorLookupItem[] = [];
  openBillOptions: OpenBillLookupItem[] = [];
  search = "";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  totalCollected = 0;
  totalPayments = 0;
  loading = false;
  actionLoading = false;
  lookupLoading = false;
  error = "";
  success = "";

  modalOpen = false;
  form: ElectricityPaymentFormState = { ...EMPTY_FORM };

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

  private buildCacheKey(page: number) {
    return JSON.stringify({
      page,
      limit: this.PAGE_SIZE,
      search: this.search || "",
    });
  }

  private invalidateCache() {
    this.pageCache.clear();
  }

  get observerSnapshot() {
    return {
      items: this.items,
      subscriberOptions: this.subscriberOptions,
      collectorOptions: this.collectorOptions,
      openBillOptions: this.openBillOptions,
      search: this.search,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      totalCollected: this.totalCollected,
      totalPayments: this.totalPayments,
      loading: this.loading,
      actionLoading: this.actionLoading,
      lookupLoading: this.lookupLoading,
      error: this.error,
      success: this.success,
      modalOpen: this.modalOpen,
      form: this.form,
      selectedBill: this.selectedBill,
    };
  }

  get selectedBill() {
    return this.openBillOptions.find((bill) => bill.id === this.form.bill_id) ?? null;
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setForm(value: SetStateAction<ElectricityPaymentFormState>) {
    this.form = typeof value === "function" ? value(this.form) : value;
  }

  setError(message: string) {
    this.showError(message);
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await Promise.all([
      this.loadPayments({ errorFallback }),
      this.loadSubscribers({ errorFallback }),
      this.loadCollectors({ errorFallback }),
    ]);
  }

  async loadPayments(options: {
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
        this.totalCollected = cached.totalCollected;
        this.totalPayments = cached.totalPayments;
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

        const response = await getElectricityPayments({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
        });

        runInAction(() => {
          const items = response.data?.items ?? [];
          const totalItems = response.data?.pagination.total ?? 0;
          const totalPages = response.data?.pagination.total_pages ?? 1;
          const totalCollected = response.data?.summary.total_collected ?? 0;
          const totalPayments = response.data?.summary.total_payments ?? 0;

          this.page = currentPage;
          this.items = items;
          this.totalItems = totalItems;
          this.totalPages = totalPages;
          this.totalCollected = totalCollected;
          this.totalPayments = totalPayments;
          this.pageCache.set(cacheKey, {
            items,
            totalItems,
            totalPages,
            totalCollected,
            totalPayments,
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
        this.lookupLoading = true;
        const subscribers = await getPaymentSubscribers();
        runInAction(() => {
          this.subscriberOptions = subscribers;
          this.subscribersLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.subscriberOptions = [];
          this.subscribersLoaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      } finally {
        runInAction(() => {
          this.lookupLoading = false;
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

  async loadCollectors(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.collectorsLoaded) {
      return;
    }

    if (!options.force && this.inFlightCollectors) {
      await this.inFlightCollectors;
      return;
    }

    const requestPromise = (async () => {
      try {
        this.lookupLoading = true;
        const collectors = await getElectricityCollectors();

        runInAction(() => {
          this.collectorOptions = collectors.filter((collector) => {
            if (collector.role === "owner" || collector.role === "admin") {
              return true;
            }

            if (
              typeof collector.access === "object" &&
              collector.access !== null &&
              "electricity" in (collector.access as Record<string, unknown>)
            ) {
              return Boolean((collector.access as Record<string, unknown>).electricity);
            }

            return false;
          });
          this.collectorsLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.collectorOptions = [];
          this.collectorsLoaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      } finally {
        runInAction(() => {
          this.lookupLoading = false;
        });
      }
    })();

    this.inFlightCollectors = requestPromise;
    try {
      await requestPromise;
    } finally {
      this.inFlightCollectors = null;
    }
  }

  async loadOpenBills(options: {
    errorFallback: string;
    subscriberId: string;
    force?: boolean;
  }): Promise<void> {
    const cacheKey = options.subscriberId || "__all__";
    const cached = this.openBillsCache.get(cacheKey);

    if (!options.force && cached) {
      runInAction(() => {
        this.openBillOptions = cached;
      });
      return;
    }

    if (!options.force) {
      const inFlight = this.inFlightOpenBills.get(cacheKey);
      if (inFlight) {
        await inFlight;
        return;
      }
    }

    const requestPromise = (async () => {
      try {
        this.lookupLoading = true;
        const bills = await getOpenBills(options.subscriberId || undefined);
        runInAction(() => {
          this.openBillsCache.set(cacheKey, bills);
          this.openBillOptions = bills;
        });
      } catch (error) {
        runInAction(() => {
          this.openBillOptions = [];
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      } finally {
        runInAction(() => {
          this.lookupLoading = false;
        });
      }
    })();

    this.inFlightOpenBills.set(cacheKey, requestPromise);
    try {
      await requestPromise;
    } finally {
      this.inFlightOpenBills.delete(cacheKey);
    }
  }

  openAdd() {
    this.modalOpen = true;
    this.form = { ...EMPTY_FORM };
    this.openBillOptions = [];
    this.error = "";
  }

  closeModal() {
    this.modalOpen = false;
    this.form = { ...EMPTY_FORM };
    this.openBillOptions = [];
    this.error = "";
  }

  async onSubscriberSelected(
    subscriberId: string,
    errorFallback: string
  ): Promise<void> {
    this.form = {
      ...this.form,
      subscriber_id: subscriberId,
      bill_id: "",
      amount: 0,
    };
    this.openBillOptions = [];

    if (!subscriberId) {
      return;
    }

    await this.loadOpenBills({
      errorFallback,
      subscriberId,
    });
  }

  onBillSelected(billId: string) {
    const bill = this.openBillOptions.find((item) => item.id === billId);
    this.form = {
      ...this.form,
      bill_id: billId,
      amount: bill ? Number(bill.outstanding_amount.toFixed(2)) : 0,
    };
  }

  async save(options: {
    billRequiredMessage: string;
    amountRequiredMessage: string;
    amountExceededMessage: string;
    createdSuccessMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    if (!this.form.bill_id) {
      this.showError(options.billRequiredMessage);
      return false;
    }

    if (!Number.isFinite(this.form.amount) || this.form.amount <= 0) {
      this.showError(options.amountRequiredMessage);
      return false;
    }

    const selectedBill = this.selectedBill;
    if (!selectedBill) {
      this.showError(options.billRequiredMessage);
      return false;
    }

    if (this.form.amount > selectedBill.outstanding_amount) {
      this.showError(options.amountExceededMessage);
      return false;
    }

    try {
      this.actionLoading = true;
      this.error = "";

      await createElectricityPayment({
        bill_id: this.form.bill_id,
        amount: this.form.amount,
        received_by: this.form.collected_by || null,
        status: "paid",
      });

      runInAction(() => {
        this.closeModal();
        this.page = 1;
        this.invalidateCache();
        this.openBillsCache.clear();
        this.showSuccess(options.createdSuccessMessage);
      });

      billsStore.clearListCache();

      await this.loadPayments({
        errorFallback: options.errorFallback,
        targetPage: 1,
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
}

export const electricityPaymentsStore = new ElectricityPaymentsStore();
