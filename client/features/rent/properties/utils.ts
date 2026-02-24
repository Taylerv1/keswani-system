// ============================================================
// Property Module — Utility Functions
// Combines: propertyMappers + unitHelpers
// ============================================================

import type { Property } from "./types";

// --------------- Property Mapper Utilities ---------------

export function getPropertyOccupancyStatus(
  property: Pick<Property, "total_units" | "rented_units">
): "full" | "vacant" {
  return property.total_units > 0 &&
    property.rented_units === property.total_units
    ? "full"
    : "vacant";
}

export function getPropertyAddress(
  property: Pick<Property, "address" | "city">
): string {
  return [property.address, property.city].filter(Boolean).join(", ") || "-";
}

// --------------- Unit Helper Utilities ---------------

export type CreateUnitInput = {
  unit_number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  description?: string;
};

export const EMPTY_UNIT: CreateUnitInput = {
  unit_number: "",
};

export function parseOptionalInt(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function sanitizeUnit(unit: CreateUnitInput): CreateUnitInput | null {
  const unitNumber = unit.unit_number.trim();
  if (!unitNumber) return null;

  const sanitized: CreateUnitInput = { unit_number: unitNumber };
  if (typeof unit.floor === "number") sanitized.floor = unit.floor;
  if (typeof unit.bedrooms === "number") sanitized.bedrooms = unit.bedrooms;
  if (typeof unit.bathrooms === "number") sanitized.bathrooms = unit.bathrooms;
  if (typeof unit.area_sqm === "number") sanitized.area_sqm = unit.area_sqm;

  const description = unit.description?.trim();
  if (description) sanitized.description = description;

  return sanitized;
}
