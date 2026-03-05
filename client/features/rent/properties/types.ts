// ============================================================
// Property Module — Canonical Type Definitions
// All Property-related types live here. No other module should
// define Property types — import from this file instead.
// ============================================================

// --------------- Domain types (used by UI layer) ---------------

export type PropertyType = "building" | "house" | "land" | "commercial";

export interface PropertyUnit {
  id: string;
  unit_number: string;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | string | null;
  description: string | null;
}

export interface Property {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  type: PropertyType;
  is_for_rent: boolean;
  is_for_electricity: boolean;
  managed_by: string | null;
  manager_name: string | null;
  owner_notes: string | null;
  total_units: number;
  rented_units: number;
  available_units: number;
  units: PropertyUnit[];
  created_at: string;
  updated_at: string;
}

// --------------- API DTOs (match backend response shapes) ---------------

export interface PropertyUnitDto {
  id: string;
  unit_number: string;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | string | null;
  description: string | null;
}

export interface PropertyDto {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  type: PropertyType;
  is_for_rent: boolean;
  is_for_electricity: boolean;
  managed_by: string | null;
  manager_name: string | null;
  owner_notes: string | null;
  total_units: number;
  rented_units: number;
  available_units: number;
  units: PropertyUnitDto[];
  created_at: string;
  updated_at: string;
}

export interface PropertyLookup {
  id: string;
  name: string;
  type: string;
  units: { id: string; unit_number: string; floor: number | null }[];
}

// --------------- API Input types ---------------

export interface CreatePropertyInput {
  name: string;
  address?: string;
  city?: string;
  type: PropertyType;
  is_for_rent?: boolean;
  is_for_electricity?: boolean;
  managed_by?: string;
  owner_notes?: string;
  units?: {
    unit_number: string;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
    area_sqm?: number;
    description?: string;
  }[];
}

export interface UpdatePropertyInput {
  name?: string;
  address?: string;
  city?: string;
  type?: PropertyType;
  is_for_rent?: boolean;
  is_for_electricity?: boolean;
  managed_by?: string | null;
  owner_notes?: string | null;
  units?: {
    id?: string;
    unit_number: string;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
    area_sqm?: number;
    description?: string;
  }[];
}
