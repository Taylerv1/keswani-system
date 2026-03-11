import { makeAutoObservable, runInAction } from "mobx";
import type { SetStateAction } from "react";
import {
  createElectricityBuilding,
  deleteElectricityBuilding,
  getElectricityBuildingById,
  getElectricityBuildings,
  updateElectricityBuilding,
  type ElectricityBuildingItem,
} from "./api";
import {
  EMPTY_UNIT,
  sanitizeUnit,
  type CreateUnitInput,
} from "@/features/rent/properties/utils";
import { isJsonDirty } from "@/lib/formDirty";

type PropertyType = "building" | "house" | "land" | "commercial";

export interface BuildingFormState {
  name: string;
  type: PropertyType;
  isForRent: boolean;
  isForElectricity: boolean;
  address: string;
  city: string;
  ownerNotes: string;
}

const EMPTY_BUILDING_FORM: BuildingFormState = {
  name: "",
  type: "building",
  isForRent: true,
  isForElectricity: true,
  address: "",
  city: "",
  ownerNotes: "",
};

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
  actionLoading = false;
  error = "";
  success = "";
  detailItem: ElectricityBuildingItem | null = null;
  deleteId: string | null = null;

  modalOpen = false;
  modalLoading = false;
  editItem: ElectricityBuildingItem | null = null;
  form: BuildingFormState = { ...EMPTY_BUILDING_FORM };
  units: CreateUnitInput[] = [];
  unitDraft: CreateUnitInput = { ...EMPTY_UNIT };
  unitModalOpen = false;
  private initialEditSnapshot: { form: BuildingFormState; units: CreateUnitInput[] } | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private flashVersion = 0;

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

  private clearFlashMessages() {
    this.error = "";
    this.success = "";
    this.clearFlashTimer();
  }

  private invalidateCache() {
    this.pageCache.clear();
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
      actionLoading: this.actionLoading,
      error: this.error,
      success: this.success,
      detailItem: this.detailItem,
      deleteId: this.deleteId,
      modalOpen: this.modalOpen,
      modalLoading: this.modalLoading,
      editItem: this.editItem,
      form: this.form,
      units: this.units,
      unitDraft: this.unitDraft,
      unitModalOpen: this.unitModalOpen,
    };
  }

  get isEditDirty() {
    if (!this.editItem) return true;
    if (!this.initialEditSnapshot) return true;

    return (
      isJsonDirty(this.initialEditSnapshot.form, this.form) ||
      isJsonDirty(this.initialEditSnapshot.units, this.units)
    );
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

  setDeleteId(value: string | null) {
    this.deleteId = value;
  }

  setForm(value: SetStateAction<BuildingFormState>) {
    this.form = typeof value === "function" ? value(this.form) : value;
  }

  setUnits(value: SetStateAction<CreateUnitInput[]>) {
    this.units = typeof value === "function" ? value(this.units) : value;
  }

  setUnitDraft(value: SetStateAction<CreateUnitInput>) {
    this.unitDraft =
      typeof value === "function" ? value(this.unitDraft) : value;
  }

  setUnitModalOpen(value: SetStateAction<boolean>) {
    this.unitModalOpen =
      typeof value === "function" ? value(this.unitModalOpen) : value;
  }

  handleUnitTypeChange(value: PropertyType) {
    this.form = { ...this.form, type: value };

    if (value === "house") {
      if (this.units.length > 0) {
        const base = this.units[0];
        this.units = [{ ...base, unit_number: base.unit_number || "HOUSE" }];
      } else {
        this.units = [{ ...EMPTY_UNIT, unit_number: "HOUSE" }];
      }
      return;
    }

    if (value === "building") {
      this.units = this.units.length > 1 ? this.units : [];
      return;
    }

    this.units = [];
  }

  updateHouseUnit<K extends keyof CreateUnitInput>(
    key: K,
    value: CreateUnitInput[K]
  ) {
    this.units = (() => {
      const base = this.units[0] ?? { ...EMPTY_UNIT };
      return [{ ...base, [key]: value }];
    })();
  }

  addBuildingUnit(unitNumberRequiredMessage = "Unit number is required") {
    const sanitized = sanitizeUnit(this.unitDraft);
    if (!sanitized) {
      this.showError(unitNumberRequiredMessage);
      return;
    }

    this.units = [...this.units, sanitized];
    this.unitDraft = { ...EMPTY_UNIT };
    this.unitModalOpen = false;
  }

  private resetFormState() {
    this.form = { ...EMPTY_BUILDING_FORM };
    this.units = [];
    this.unitDraft = { ...EMPTY_UNIT };
    this.unitModalOpen = false;
  }

  openAdd() {
    this.editItem = null;
    this.modalLoading = false;
    this.initialEditSnapshot = null;
    this.resetFormState();
    this.modalOpen = true;
  }

  async openEdit(item: ElectricityBuildingItem, options: { errorFallback: string }) {
    this.editItem = item;
    this.modalOpen = true;
    this.modalLoading = true;

    try {
      this.clearFlashMessages();

      const response = await getElectricityBuildingById(item.id);
      const detail = response.data;
      if (!detail) {
        this.showError(options.errorFallback);
        return;
      }

      const mappedUnits: CreateUnitInput[] = (detail.units ?? []).map((unit) => ({
        id: unit.id,
        unit_number: unit.unit_number,
        floor: unit.floor ?? undefined,
        bedrooms: unit.bedrooms ?? undefined,
        bathrooms: unit.bathrooms ?? undefined,
        area_sqm:
          unit.area_sqm !== null && unit.area_sqm !== undefined
            ? Number(unit.area_sqm)
            : undefined,
        description: unit.description ?? undefined,
      }));

      if (detail.type === "house" && mappedUnits.length === 0) {
        mappedUnits.push({ ...EMPTY_UNIT, unit_number: "HOUSE" });
      }

	      runInAction(() => {
	        const nextForm: BuildingFormState = {
	          name: detail.name,
	          type: detail.type,
	          isForRent: detail.is_for_rent ?? true,
	          isForElectricity: detail.is_for_electricity ?? true,
	          address: detail.address ?? "",
	          city: detail.city ?? "",
	          ownerNotes: detail.owner_notes ?? "",
	        };
	        const nextUnits =
	          detail.type === "building" || detail.type === "house"
	            ? mappedUnits
	            : [];

	        this.initialEditSnapshot = { form: nextForm, units: nextUnits };
	        this.form = nextForm;
	        this.units = nextUnits;
	      });
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
      });
    } finally {
      runInAction(() => {
        this.modalLoading = false;
      });
    }
  }

  closeModal() {
    this.modalOpen = false;
    this.modalLoading = false;
    this.editItem = null;
    this.initialEditSnapshot = null;
    this.resetFormState();
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
    propertyNameRequiredMessage: string;
    usageRequiredMessage: string;
    successMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    const name = this.form.name.trim();
    if (!name) {
      this.showError(options.propertyNameRequiredMessage);
      return false;
    }

    if (!this.form.isForRent && !this.form.isForElectricity) {
      this.showError(options.usageRequiredMessage);
      return false;
    }

    try {
      this.actionLoading = true;
      this.clearFlashMessages();

      const sanitizedUnits = this.units
        .map((unit) => sanitizeUnit(unit))
        .filter((unit): unit is CreateUnitInput => unit !== null);

      const houseBase = this.units[0] ?? { ...EMPTY_UNIT };
      const houseUnit: CreateUnitInput = {
        unit_number: (houseBase.unit_number || "HOUSE").trim() || "HOUSE",
      };
      if (typeof houseBase.id === "string") houseUnit.id = houseBase.id;
      if (typeof houseBase.floor === "number") houseUnit.floor = houseBase.floor;
      if (typeof houseBase.bedrooms === "number") {
        houseUnit.bedrooms = houseBase.bedrooms;
      }
      if (typeof houseBase.bathrooms === "number") {
        houseUnit.bathrooms = houseBase.bathrooms;
      }
      if (typeof houseBase.area_sqm === "number") {
        houseUnit.area_sqm = houseBase.area_sqm;
      }
      const houseDescription = houseBase.description?.trim();
      if (houseDescription) houseUnit.description = houseDescription;

      const unitsPayload =
        this.form.type === "house"
          ? [houseUnit]
          : this.form.type === "building"
            ? sanitizedUnits
            : undefined;

      const payload = {
        name,
        type:
          this.form.type === "land"
            ? "building"
            : (this.form.type as "building" | "house" | "commercial"),
        address: this.form.address.trim() || undefined,
        city: this.form.city.trim() || undefined,
        owner_notes: this.form.ownerNotes.trim() || undefined,
        is_for_rent: this.form.isForRent,
        is_for_electricity: this.form.isForElectricity,
        units: unitsPayload,
      };

      if (this.editItem) {
        await updateElectricityBuilding(this.editItem.id, payload);
      } else {
        await createElectricityBuilding(payload);
      }

      runInAction(() => {
        const targetPage = this.editItem ? this.page : 1;
        this.closeModal();
        this.page = targetPage;
        this.invalidateCache();
        this.showSuccess(options.successMessage);
      });

      await this.loadBuildings({
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
      this.clearFlashMessages();

      await deleteElectricityBuilding(targetDeleteId);

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

        if (this.detailItem?.id === targetDeleteId) {
          this.detailItem = null;
        }
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.showError(getErrorMessage(error, options.errorFallback));
        this.deleteId = null;
      });
      return false;
    } finally {
      runInAction(() => {
        this.actionLoading = false;
      });
    }
  }
}

export const buildingsStore = new BuildingsStore();
