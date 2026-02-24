// ============================================================
// Property Module — Public Barrel
// import { PropertyPage } from "@/features/rent/properties";
// ============================================================

// Page
export { PropertyPage } from "./PropertyPage";

// Types (canonical source)
export type {
  Property,
  PropertyType,
  PropertyUnit,
  PropertyDto,
  PropertyUnitDto,
  PropertyLookup,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "./types";

// Hooks
export { usePropertyState, PAGE_SIZE } from "./hooks";
export type { TranslateFn } from "./hooks";
export { usePropertyForm } from "./hooks";

// Components
export { PropertyTable } from "./components/PropertyTable";
export { PropertyTableRow } from "./components/PropertyTableRow";
export { PropertyMobileCard } from "./components/PropertyMobileCard";
export { PropertyCreateModal } from "./components/PropertyCreateModal";
export { PropertyEditModal } from "./components/PropertyEditModal";
export { PropertyDeleteModal } from "./components/PropertyDeleteModal";

// API
export {
  getProperties,
  getPropertyById,
  getPropertiesLookup,
  createProperty,
  updateProperty,
  deleteProperty,
} from "./api";
export type {
  ApiResponse,
  PaginatedResponse,
} from "./api";

// Utils
export {
  sanitizeUnit,
  parseOptionalInt,
  parseOptionalNumber,
  EMPTY_UNIT,
  getPropertyOccupancyStatus,
  getPropertyAddress,
} from "./utils";
export type { CreateUnitInput } from "./utils";
