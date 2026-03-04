import { makeAutoObservable, runInAction } from "mobx";
import {
  createSubscriber,
  deleteSubscriber,
  getSubscriberById,
  getSubscriberProperties,
  getSubscribers,
  updateSubscriber,
} from "./api";
import type {
  CreateSubscriberInput,
  PropertyLookup,
  SubscriberDetail,
  SubscriberListItem,
  UpdateSubscriberInput,
} from "./types";

export type SubscriberStatusFilter = "all" | "active" | "inactive";

export interface SubscriberFormState {
  full_name: string;
  email: string;
  phone: string;
  subscription_number: string;
  property_id: string;
  unit_id: string;
  status: "active" | "inactive";
  notes: string;
}

export const EMPTY_SUBSCRIBER_FORM: SubscriberFormState = {
  full_name: "",
  email: "",
  phone: "",
  subscription_number: "",
  property_id: "",
  unit_id: "",
  status: "active",
  notes: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class SubscribersStore {
  PAGE_SIZE = 8;
  private subscriberPageCache = new Map<
    string,
    {
      items: SubscriberListItem[];
      totalItems: number;
      totalPages: number;
    }
  >();
  private propertiesLoaded = false;
  private inFlightSubscribers = new Map<string, Promise<void>>();
  private inFlightProperties: Promise<void> | null = null;

  subscribers: SubscriberListItem[] = [];
  properties: PropertyLookup[] = [];
  search = "";
  filterStatus: SubscriberStatusFilter = "all";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  actionLoading = false;
  detailLoading = false;
  error = "";

  modalOpen = false;
  editItem: SubscriberListItem | null = null;
  form: SubscriberFormState = { ...EMPTY_SUBSCRIBER_FORM };
  deleteId: string | null = null;

  detailOpen = false;
  detailData: SubscriberDetail | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private buildSubscriberCacheKey(page: number) {
    return JSON.stringify({
      page,
      limit: this.PAGE_SIZE,
      search: this.search || "",
      status: this.filterStatus === "all" ? "" : this.filterStatus,
    });
  }

  private invalidateSubscriberCache() {
    this.subscriberPageCache.clear();
  }

  private invalidatePropertiesCache() {
    this.propertiesLoaded = false;
  }

  // Used by component-level autorun hook to subscribe to store changes.
  get observerSnapshot() {
    return {
      subscribers: this.subscribers,
      properties: this.properties,
      search: this.search,
      filterStatus: this.filterStatus,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      actionLoading: this.actionLoading,
      detailLoading: this.detailLoading,
      error: this.error,
      modalOpen: this.modalOpen,
      editItem: this.editItem,
      form: this.form,
      deleteId: this.deleteId,
      detailOpen: this.detailOpen,
      detailData: this.detailData,
    };
  }

  get unitOptions() {
    const selectedProperty = this.properties.find(
      (property) => property.id === this.form.property_id
    );
    return selectedProperty?.units ?? [];
  }

  setError(message: string) {
    this.error = message;
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setFilterStatus(value: SubscriberStatusFilter) {
    this.filterStatus = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setDeleteId(value: string | null) {
    this.deleteId = value;
  }

  setDetailOpen(value: boolean) {
    this.detailOpen = value;
    if (!value) {
      this.detailData = null;
      this.detailLoading = false;
    }
  }

  setFormField<K extends keyof SubscriberFormState>(
    key: K,
    value: SubscriberFormState[K]
  ) {
    this.form = { ...this.form, [key]: value };
  }

  openAdd() {
    this.editItem = null;
    this.form = { ...EMPTY_SUBSCRIBER_FORM };
    this.modalOpen = true;
  }

  openEdit(item: SubscriberListItem) {
    this.editItem = item;
    this.form = {
      full_name: item.client.full_name,
      email: item.client.email ?? "",
      phone: item.client.phone ?? "",
      subscription_number: item.subscription_number,
      property_id: item.property?.id ?? "",
      unit_id: item.unit?.id ?? "",
      status: item.is_active ? "active" : "inactive",
      notes: item.notes ?? "",
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editItem = null;
    this.form = { ...EMPTY_SUBSCRIBER_FORM };
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await Promise.all([
      this.loadSubscribers({ errorFallback }),
      this.loadProperties({ errorFallback }),
    ]);
  }

  async loadSubscribers(options: {
    errorFallback: string;
    targetPage?: number;
    force?: boolean;
  }): Promise<void> {
    const currentPage = options.targetPage ?? this.page;
    const cacheKey = this.buildSubscriberCacheKey(currentPage);
    const cached = this.subscriberPageCache.get(cacheKey);

    if (!options.force && cached) {
      runInAction(() => {
        this.page = currentPage;
        this.error = "";
        this.subscribers = cached.items;
        this.totalItems = cached.totalItems;
        this.totalPages = cached.totalPages;
        this.loading = false;
      });
      return;
    }

    if (!options.force) {
      const inFlight = this.inFlightSubscribers.get(cacheKey);
      if (inFlight) {
        await inFlight;
        const afterWait = this.subscriberPageCache.get(cacheKey);
        if (afterWait) {
          runInAction(() => {
            this.page = currentPage;
            this.error = "";
            this.subscribers = afterWait.items;
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

        const response = await getSubscribers({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
          status: this.filterStatus === "all" ? undefined : this.filterStatus,
        });

        runInAction(() => {
          const items = response.data?.items ?? [];
          const totalItems = response.data?.pagination.total ?? 0;
          const totalPages = response.data?.pagination.total_pages ?? 1;

          this.page = currentPage;
          this.subscribers = items;
          this.totalItems = totalItems;
          this.totalPages = totalPages;
          this.subscriberPageCache.set(cacheKey, {
            items,
            totalItems,
            totalPages,
          });
        });
      } catch (error) {
        runInAction(() => {
          this.error = getErrorMessage(error, options.errorFallback);
          this.subscribers = [];
          this.totalItems = 0;
          this.totalPages = 1;
        });
      } finally {
        runInAction(() => {
          this.loading = false;
        });
      }
    })();

    this.inFlightSubscribers.set(cacheKey, requestPromise);

    try {
      await requestPromise;
    } finally {
      this.inFlightSubscribers.delete(cacheKey);
    }
  }

  async loadProperties(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.propertiesLoaded) {
      return;
    }

    if (!options.force && this.inFlightProperties) {
      await this.inFlightProperties;
      return;
    }

    const requestPromise = (async () => {
      try {
        const properties = await getSubscriberProperties();
        runInAction(() => {
          this.properties = properties;
          this.propertiesLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.properties = [];
          this.propertiesLoaded = false;
          this.error = getErrorMessage(error, options.errorFallback);
        });
      }
    })();

    this.inFlightProperties = requestPromise;

    try {
      await requestPromise;
    } finally {
      this.inFlightProperties = null;
    }
  }

  async save(options: {
    fullNameRequiredMessage: string;
    subscriptionRequiredMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    const fullName = this.form.full_name.trim();
    const subscriptionNumber = this.form.subscription_number.trim();

    if (!fullName) {
      this.error = options.fullNameRequiredMessage;
      return false;
    }

    if (!subscriptionNumber) {
      this.error = options.subscriptionRequiredMessage;
      return false;
    }

    try {
      this.actionLoading = true;
      this.error = "";

      if (this.editItem) {
        const payload: UpdateSubscriberInput = {
          full_name: fullName,
          email: this.form.email.trim() || null,
          phone: this.form.phone.trim() || null,
          subscription_number: subscriptionNumber,
          property_id: this.form.property_id || null,
          unit_id: this.form.unit_id || null,
          is_active: this.form.status === "active",
          notes: this.form.notes.trim() || null,
        };

        await updateSubscriber(this.editItem.id, payload);
      } else {
        const payload: CreateSubscriberInput = {
          full_name: fullName,
          email: this.form.email.trim() || undefined,
          phone: this.form.phone.trim() || undefined,
          subscription_number: subscriptionNumber,
          property_id: this.form.property_id || undefined,
          unit_id: this.form.unit_id || undefined,
          is_active: this.form.status === "active",
          notes: this.form.notes.trim() || undefined,
        };

        await createSubscriber(payload);
      }

      runInAction(() => {
        this.closeModal();
        this.page = 1;
        this.invalidateSubscriberCache();
      });

      await this.loadSubscribers({
        errorFallback: options.errorFallback,
        targetPage: 1,
        force: true,
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error, options.errorFallback);
      });
      return false;
    } finally {
      runInAction(() => {
        this.actionLoading = false;
      });
    }
  }

  async removeSelected(options: { errorFallback: string }): Promise<boolean> {
    if (!this.deleteId) return false;

    try {
      this.actionLoading = true;
      this.error = "";

      await deleteSubscriber(this.deleteId);

      runInAction(() => {
        this.deleteId = null;
        this.invalidateSubscriberCache();
      });

      await this.loadSubscribers({
        errorFallback: options.errorFallback,
        targetPage: this.page,
        force: true,
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error, options.errorFallback);
      });
      return false;
    } finally {
      runInAction(() => {
        this.actionLoading = false;
      });
    }
  }

  async openDetails(
    item: SubscriberListItem,
    options: { errorFallback: string }
  ): Promise<void> {
    try {
      this.detailLoading = true;
      this.error = "";
      this.detailOpen = true;

      const response = await getSubscriberById(item.id);

      runInAction(() => {
        this.detailData = response.data ?? null;
      });
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error, options.errorFallback);
      });
    } finally {
      runInAction(() => {
        this.detailLoading = false;
      });
    }
  }
}

export const subscribersStore = new SubscribersStore();
