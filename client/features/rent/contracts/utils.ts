import type {
  ContractClientFormValues,
  ContractFormValues,
  ContractListItem,
  CreateContractClientInput,
  CreateContractInput,
} from "./types";

export const PAGE_SIZE = 6;

export const EMPTY_CONTRACT_FORM: ContractFormValues = {
  client_id: "",
  property_id: "",
  unit_id: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  monthly_rent: 0,
  currency: "USD",
  deposit_amount: 0,
  status: "active",
  notes: "",
};

export const EMPTY_CONTRACT_CLIENT_FORM: ContractClientFormValues = {
  full_name: "",
  email: "",
  phone: "",
  notes: "",
};

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function formatDateOnly(value: string | null): string {
  if (!value) return "—";
  if (value.length >= 10) {
    return value.slice(0, 10);
  }
  return value;
}

export function getDaysRemaining(endDate: string | null): number {
  if (!endDate) return 0;

  const target = new Date(endDate).getTime();
  if (Number.isNaN(target)) return 0;

  const diff = (target - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(diff));
}

export function buildCreateContractPayload(
  form: ContractFormValues
): CreateContractInput {
  return {
    unit_id: form.unit_id,
    client_id: form.client_id,
    start_date: form.start_date,
    end_date: form.end_date || undefined,
    monthly_rent: Number(form.monthly_rent) || 0,
    currency: form.currency.trim() || "USD",
    deposit_amount: Number(form.deposit_amount) || 0,
    status: form.status,
    notes: form.notes.trim() || undefined,
  };
}

function normalizeOptionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildCreateContractClientPayload(
  form: ContractClientFormValues
): CreateContractClientInput {
  return {
    full_name: form.full_name.trim(),
    email: normalizeOptionalField(form.email),
    phone: normalizeOptionalField(form.phone),
    notes: normalizeOptionalField(form.notes),
  };
}

export function findContractPropertyId(item: ContractListItem): string {
  return item.property_id;
}
