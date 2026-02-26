import { makeAutoObservable, runInAction } from "mobx";
import { getContractLookups, getContracts } from "./contracts/api";
import type {
  ClientLookupItem,
  ContractListItem,
  ContractQueryParams,
  PropertyLookupItem,
} from "./contracts/types";
import { getProperties } from "./properties/api";
import type { Property } from "./properties/types";
import { getTenants } from "./tenants/api";
import type { TenantListItem, TenantQueryParams } from "./tenants/types";

export type RecentActivityItem = {
  id: string;
  type: "late_payment" | "contract_ending" | "maintenance" | "vacant_property";
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  related_id: string;
  created_at: string;
};

export type RentOverview = {
  total_properties: number;
  total_units: number;
  rented_units: number;
  vacant_units: number;
  total_tenants: number;
  monthly_income: number;
  late_payments: number;
  contracts_ending_soon: number;
  maintenance_notifications: number;
  occupancy_rate: number;
  recent_activity: RecentActivityItem[];
};

type PaginatedSnapshot<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
};

type LookupSnapshot = {
  properties: PropertyLookupItem[];
  clients: ClientLookupItem[];
};

function stableKey(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

class RentStore {
  overview: RentOverview | null = null;
  private propertyPages = new Map<string, PaginatedSnapshot<Property>>();
  private tenantPages = new Map<string, PaginatedSnapshot<TenantListItem>>();
  private contractPages = new Map<string, PaginatedSnapshot<ContractListItem>>();
  private contractLookups: LookupSnapshot | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getOverviewSnapshot() {
    return this.overview;
  }

  async loadOverview(options?: { force?: boolean }) {
    if (!options?.force && this.overview) {
      return { data: this.overview, fromCache: true };
    }

    const res = await fetch("/api/rent/overview", {
      method: "GET",
      cache: "no-store",
    });
    const payload = await res.json();

    if (!res.ok || !payload?.success || !payload?.data) {
      throw new Error(payload?.error || "Failed to load rent overview.");
    }

    const snapshot = payload.data as RentOverview;
    runInAction(() => {
      this.overview = snapshot;
    });

    return { data: snapshot, fromCache: false };
  }

  private propertyKey(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: "full" | "vacant";
  }) {
    return stableKey({
      page: params.page ?? 1,
      limit: params.limit ?? 6,
      search: params.search ?? "",
      type: params.type ?? "",
      status: params.status ?? "",
    });
  }

  getPropertiesSnapshot(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: "full" | "vacant";
  }) {
    return this.propertyPages.get(this.propertyKey(params)) ?? null;
  }

  async loadProperties(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      status?: "full" | "vacant";
    },
    options?: { force?: boolean }
  ) {
    const key = this.propertyKey(params);
    const cached = this.propertyPages.get(key);

    if (!options?.force && cached) {
      return { data: cached, fromCache: true };
    }

    const response = await getProperties(params);
    const items = (response.data?.items ?? []) as Property[];
    const pagination = response.data?.pagination;
    const snapshot: PaginatedSnapshot<Property> = {
      items,
      totalItems: pagination?.total ?? items.length,
      totalPages: Math.max(1, pagination?.total_pages ?? 1),
    };

    runInAction(() => {
      this.propertyPages.set(key, snapshot);
    });

    return { data: snapshot, fromCache: false };
  }

  private tenantKey(params: TenantQueryParams) {
    return stableKey({
      page: params.page ?? 1,
      limit: params.limit ?? 6,
      search: params.search ?? "",
      contract_presence: params.contract_presence ?? "",
    });
  }

  getTenantsSnapshot(params: TenantQueryParams) {
    return this.tenantPages.get(this.tenantKey(params)) ?? null;
  }

  async loadTenants(params: TenantQueryParams, options?: { force?: boolean }) {
    const key = this.tenantKey(params);
    const cached = this.tenantPages.get(key);

    if (!options?.force && cached) {
      return { data: cached, fromCache: true };
    }

    const response = await getTenants(params);
    const items = response.data?.items ?? [];
    const pagination = response.data?.pagination;
    const snapshot: PaginatedSnapshot<TenantListItem> = {
      items,
      totalItems: pagination?.total ?? items.length,
      totalPages: Math.max(1, pagination?.total_pages ?? 1),
    };

    runInAction(() => {
      this.tenantPages.set(key, snapshot);
    });

    return { data: snapshot, fromCache: false };
  }

  private contractKey(params: ContractQueryParams) {
    return stableKey({
      page: params.page ?? 1,
      limit: params.limit ?? 6,
      search: params.search ?? "",
      status: params.status ?? "",
    });
  }

  getContractsSnapshot(params: ContractQueryParams) {
    return this.contractPages.get(this.contractKey(params)) ?? null;
  }

  async loadContracts(
    params: ContractQueryParams,
    options?: { force?: boolean }
  ) {
    const key = this.contractKey(params);
    const cached = this.contractPages.get(key);

    if (!options?.force && cached) {
      return { data: cached, fromCache: true };
    }

    const response = await getContracts(params);
    const items = response.data?.items ?? [];
    const pagination = response.data?.pagination;
    const snapshot: PaginatedSnapshot<ContractListItem> = {
      items,
      totalItems: pagination?.total ?? items.length,
      totalPages: Math.max(1, pagination?.total_pages ?? 1),
    };

    runInAction(() => {
      this.contractPages.set(key, snapshot);
    });

    return { data: snapshot, fromCache: false };
  }

  getContractLookupsSnapshot() {
    return this.contractLookups;
  }

  async loadContractLookups(options?: { force?: boolean }) {
    if (!options?.force && this.contractLookups) {
      return { data: this.contractLookups, fromCache: true };
    }

    const response = await getContractLookups();
    const snapshot: LookupSnapshot = {
      properties: response.data?.properties ?? [],
      clients: response.data?.clients ?? [],
    };

    runInAction(() => {
      this.contractLookups = snapshot;
    });

    return { data: snapshot, fromCache: false };
  }

  addContractLookupClient(client: ClientLookupItem) {
    if (!this.contractLookups) {
      this.contractLookups = { properties: [], clients: [client] };
      return;
    }

    if (this.contractLookups.clients.some((item) => item.id === client.id)) {
      return;
    }

    this.contractLookups = {
      ...this.contractLookups,
      clients: [client, ...this.contractLookups.clients],
    };
  }

  invalidateOverview() {
    this.overview = null;
  }

  invalidateProperties() {
    this.propertyPages.clear();
  }

  invalidateTenants() {
    this.tenantPages.clear();
  }

  invalidateContracts() {
    this.contractPages.clear();
  }

  invalidateContractLookups() {
    this.contractLookups = null;
  }
}

export const rentStore = new RentStore();
