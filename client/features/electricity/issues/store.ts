import { makeAutoObservable, runInAction } from "mobx";
import {
  getElectricityIssues,
  getIssueLookups,
  createElectricityIssue,
  updateElectricityIssue,
  deleteElectricityIssue,
} from "./api";
import type {
  ElectricityIssue,
  IssueFormData,
  SubscriberLookup,
  EmployeeLookup,
} from "./types";
import { createEmptyForm } from "./utils";

export type IssueStatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";
export type IssuePriorityFilter = "all" | "low" | "medium" | "high";
export type IssueCategoryFilter = "all" | "billing" | "meter" | "connection" | "other";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

class IssuesStore {
  PAGE_SIZE = 10;
  private pageCache = new Map<
    string,
    {
      items: ElectricityIssue[];
      totalItems: number;
      totalPages: number;
    }
  >();
  private inFlightPages = new Map<string, Promise<void>>();
  private lookupsLoaded = false;
  private inFlightLookups: Promise<void> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

  items: ElectricityIssue[] = [];
  subscriberOptions: SubscriberLookup[] = [];
  employeeOptions: EmployeeLookup[] = [];
  search = "";
  filterStatus: IssueStatusFilter = "all";
  filterPriority: IssuePriorityFilter = "all";
  filterCategory: IssueCategoryFilter = "all";
  page = 1;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  actionLoading = false;
  error = "";
  success = "";

  modalOpen = false;
  editItem: ElectricityIssue | null = null;
  viewItem: ElectricityIssue | null = null;
  deleteId: string | null = null;
  form: IssueFormData = createEmptyForm();

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
      priority: this.filterPriority === "all" ? "" : this.filterPriority,
      category: this.filterCategory === "all" ? "" : this.filterCategory,
    });
  }

  get observerSnapshot() {
    return {
      items: this.items,
      subscriberOptions: this.subscriberOptions,
      employeeOptions: this.employeeOptions,
      search: this.search,
      filterStatus: this.filterStatus,
      filterPriority: this.filterPriority,
      filterCategory: this.filterCategory,
      page: this.page,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      loading: this.loading,
      actionLoading: this.actionLoading,
      error: this.error,
      success: this.success,
      modalOpen: this.modalOpen,
      editItem: this.editItem,
      viewItem: this.viewItem,
      deleteId: this.deleteId,
      form: this.form,
    };
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  setFilterStatus(value: IssueStatusFilter) {
    this.filterStatus = value;
    this.page = 1;
  }

  setFilterPriority(value: IssuePriorityFilter) {
    this.filterPriority = value;
    this.page = 1;
  }

  setFilterCategory(value: IssueCategoryFilter) {
    this.filterCategory = value;
    this.page = 1;
  }

  setPage(value: number) {
    this.page = value;
  }

  setDeleteId(value: string | null) {
    this.deleteId = value;
  }

  setForm(value: IssueFormData | ((prev: IssueFormData) => IssueFormData)) {
    this.form = typeof value === "function" ? value(this.form) : value;
  }

  setError(message: string) {
    this.showError(message);
  }

  openAdd() {
    this.editItem = null;
    this.form = createEmptyForm();
    this.error = "";
    this.modalOpen = true;
  }

  openEdit(item: ElectricityIssue) {
    this.editItem = item;
    this.form = {
      subscriberId: item.subscriberId,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      status: item.status,
      assignedTo: item.assigneeId ?? "",
    };
    this.error = "";
    this.modalOpen = true;
  }

  openView(item: ElectricityIssue) {
    this.viewItem = item;
  }

  closeView() {
    this.viewItem = null;
  }

  closeModal() {
    this.modalOpen = false;
    this.editItem = null;
    this.form = createEmptyForm();
    this.error = "";
  }

  async bootstrap(errorFallback: string): Promise<void> {
    await Promise.all([
      this.loadIssues({ errorFallback }),
      this.loadLookups({ errorFallback }),
    ]);
  }

  async loadLookups(options: {
    errorFallback: string;
    force?: boolean;
  }): Promise<void> {
    if (!options.force && this.lookupsLoaded) {
      return;
    }

    if (!options.force && this.inFlightLookups) {
      await this.inFlightLookups;
      return;
    }

    const requestPromise = (async () => {
      try {
        const data = await getIssueLookups();
        runInAction(() => {
          this.subscriberOptions = data.subscribers;
          this.employeeOptions = data.employees;
          this.lookupsLoaded = true;
        });
      } catch (error) {
        runInAction(() => {
          this.subscriberOptions = [];
          this.employeeOptions = [];
          this.lookupsLoaded = false;
          this.showError(getErrorMessage(error, options.errorFallback));
        });
      }
    })();

    this.inFlightLookups = requestPromise;

    try {
      await requestPromise;
    } finally {
      this.inFlightLookups = null;
    }
  }

  async loadIssues(options: {
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

        const response = await getElectricityIssues({
          page: currentPage,
          limit: this.PAGE_SIZE,
          search: this.search || undefined,
          status: this.filterStatus === "all" ? undefined : this.filterStatus,
          priority: this.filterPriority === "all" ? undefined : this.filterPriority,
          category: this.filterCategory === "all" ? undefined : this.filterCategory,
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
    titleRequiredMessage: string;
    subscriberRequiredMessage: string;
    createdSuccessMessage: string;
    updatedSuccessMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    const title = this.form.title.trim();

    if (!title) {
      this.showError(options.titleRequiredMessage);
      return false;
    }

    if (!this.editItem && !this.form.subscriberId) {
      this.showError(options.subscriberRequiredMessage);
      return false;
    }

    try {
      this.actionLoading = true;
      this.error = "";

      if (this.editItem) {
        await updateElectricityIssue(this.editItem.id, {
          title,
          description: this.form.description,
          category: this.form.category,
          priority: this.form.priority,
          status: this.form.status,
          assigned_to: this.form.assignedTo || null,
        });
      } else {
        await createElectricityIssue({
          subscriber_id: this.form.subscriberId,
          title,
          description: this.form.description || undefined,
          category: this.form.category,
          priority: this.form.priority,
        });
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

      await this.loadIssues({
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

      await deleteElectricityIssue(targetDeleteId);

      const nextTotalItems = Math.max(0, this.totalItems - 1);
      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextTotalItems / this.PAGE_SIZE)
      );
      const nextPage = Math.min(this.page, nextTotalPages);

      runInAction(() => {
        this.deleteId = null;
        this.invalidateCache();
        this.page = nextPage;
        this.showSuccess(options.successMessage);
      });

      await this.loadIssues({
        errorFallback: options.errorFallback,
        targetPage: nextPage,
        force: true,
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

export const issuesStore = new IssuesStore();
