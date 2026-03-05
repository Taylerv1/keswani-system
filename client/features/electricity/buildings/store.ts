import { makeAutoObservable, runInAction } from "mobx";
import {
  createElectricityBuilding,
  getElectricityBuildingById,
  getElectricityBuildings,
  updateElectricityBuilding,
  type ElectricityBuildingItem,
  type ElectricityBuildingType,
} from "./api";
import {
  EMPTY_UNIT,
  sanitizeUnit,
  type CreateUnitInput,
} from "@/features/rent/properties/utils";

export interface BuildingFormState {
  name: string;
  type: ElectricityBuildingType;
  address: string;
  city: string;
  owner_notes: string;
  is_for_rent: boolean;
  is_for_electricity: boolean;
}

const EMPTY_BUILDING_FORM: BuildingFormState = {
  name: "",
  type: "building",
  address: "",
  city: "",
  owner_notes: "",
  is_for_rent: true,
  is_for_electricity: true,
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
  detailItem: ElectricityBuildingItem | null = null;
  modalOpen = false;
  modalLoading = false;
  editItem: ElectricityBuildingItem | null = null;
  form: BuildingFormState = { ...EMPTY_BUILDING_FORM };
  units: CreateUnitInput[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
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
      detailItem: this.detailItem,
      modalOpen: this.modalOpen,
      modalLoading: this.modalLoading,
      editItem: this.editItem,
      form: this.form,
      units: this.units,
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

  setFormField<K extends keyof BuildingFormState>(
    key: K,
    value: BuildingFormState[K]
  ) {
    this.form = { ...this.form, [key]: value };
  }

  setBuildingType(value: ElectricityBuildingType) {
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

  updateUnitField<K extends keyof CreateUnitInput>(
    index: number,
    key: K,
    value: CreateUnitInput[K]
  ) {
    this.units = this.units.map((unit, currentIndex) =>
      currentIndex === index ? { ...unit, [key]: value } : unit
    );
  }

  addUnit() {
    this.units = [...this.units, { ...EMPTY_UNIT }];
  }

  removeUnit(index: number) {
    this.units = this.units.filter((_, currentIndex) => currentIndex !== index);
  }

  openAdd() {
    this.editItem = null;
    this.form = { ...EMPTY_BUILDING_FORM };
    this.units = [];
    this.modalOpen = true;
  }

  async openEdit(item: ElectricityBuildingItem, options: { errorFallback: string }) {
    try {
      this.modalLoading = true;
      this.error = "";

      const response = await getElectricityBuildingById(item.id);
      const detail = response.data;
      if (!detail) {
        this.error = options.errorFallback;
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
        this.editItem = item;
        this.form = {
          name: detail.name,
          type:
            detail.type === "building" ||
            detail.type === "house" ||
            detail.type === "commercial"
              ? detail.type
              : "building",
          address: detail.address ?? "",
          city: detail.city ?? "",
          owner_notes: detail.owner_notes ?? "",
          is_for_rent: detail.is_for_rent ?? true,
          is_for_electricity: detail.is_for_electricity ?? true,
        };
        this.units =
          detail.type === "building" || detail.type === "house" ? mappedUnits : [];
        this.modalOpen = true;
      });
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error, options.errorFallback);
      });
    } finally {
      runInAction(() => {
        this.modalLoading = false;
      });
    }
  }

  closeModal() {
    this.modalOpen = false;
    this.editItem = null;
    this.modalLoading = false;
    this.form = { ...EMPTY_BUILDING_FORM };
    this.units = [];
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

  async save(options: {
    propertyNameRequiredMessage: string;
    usageRequiredMessage: string;
    errorFallback: string;
  }): Promise<boolean> {
    const name = this.form.name.trim();
    if (!name) {
      this.error = options.propertyNameRequiredMessage;
      return false;
    }

    if (!this.form.is_for_rent && !this.form.is_for_electricity) {
      this.error = options.usageRequiredMessage;
      return false;
    }

    try {
      this.actionLoading = true;
      this.error = "";

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
        type: this.form.type,
        address: this.form.address.trim() || undefined,
        city: this.form.city.trim() || undefined,
        owner_notes: this.form.owner_notes.trim() || undefined,
        is_for_rent: this.form.is_for_rent,
        is_for_electricity: this.form.is_for_electricity,
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
      });

      await this.loadBuildings({
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
}

export const buildingsStore = new BuildingsStore();
