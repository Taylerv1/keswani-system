import type {
  CreateTenantInput,
  TenantContractFilter,
  TenantFormValues,
  TenantListItem,
  UpdateTenantInput,
} from "./types";

export const PAGE_SIZE = 10;

export const EMPTY_TENANT_FORM: TenantFormValues = {
  full_name: "",
  email: "",
  phone: "",
  notes: "",
};

export function normalizeOptionalField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildCreateTenantPayload(form: TenantFormValues): CreateTenantInput {
  return {
    full_name: form.full_name.trim(),
    email: normalizeOptionalField(form.email) ?? undefined,
    phone: normalizeOptionalField(form.phone) ?? undefined,
    notes: normalizeOptionalField(form.notes) ?? undefined,
  };
}

export function buildUpdateTenantPayload(form: TenantFormValues): UpdateTenantInput {
  return {
    full_name: form.full_name.trim(),
    email: normalizeOptionalField(form.email),
    phone: normalizeOptionalField(form.phone),
    notes: normalizeOptionalField(form.notes),
  };
}

export function hydrateTenantForm(item: TenantListItem): TenantFormValues {
  return {
    full_name: item.full_name,
    email: item.email ?? "",
    phone: item.phone ?? "",
    notes: item.notes ?? "",
  };
}

export function filterTenantsByContract(
  items: TenantListItem[],
  filter: TenantContractFilter
): TenantListItem[] {
  if (filter === "with_contract") {
    return items.filter((item) => Boolean(item.active_contract));
  }

  if (filter === "without_contract") {
    return items.filter((item) => !item.active_contract);
  }

  return items;
}

export function formatNullable(value: string | null | undefined): string {
  return value?.trim() ? value : "-";
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
