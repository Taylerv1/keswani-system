export { TenantsPage } from "./TenantsPage";

export {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} from "./api";

export type {
  ApiResponse,
  PaginatedResponse,
  TenantActiveContract,
  TenantListItem,
  TenantPayment,
  TenantContract,
  TenantMaintenance,
  TenantDetail,
  TenantQueryParams,
  CreateTenantInput,
  UpdateTenantInput,
  TenantFormValues,
  TenantContractFilter,
} from "./types";

export { useTenantState, useTenantForm } from "./hooks";
export type { TranslateFn } from "./hooks";

export {
  PAGE_SIZE,
  EMPTY_TENANT_FORM,
  normalizeOptionalField,
  buildCreateTenantPayload,
  buildUpdateTenantPayload,
  hydrateTenantForm,
  filterTenantsByContract,
  formatNullable,
  extractErrorMessage,
} from "./utils";

export { TenantTable } from "./components/TenantTable";
export { TenantMobileCard } from "./components/TenantMobileCard";
export { TenantFormModal } from "./components/TenantFormModal";
export { TenantViewModal } from "./components/TenantViewModal";
