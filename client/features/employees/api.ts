import type {
  EmployeeDto,
  EmployeeLookup,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "./types";

export type {
  EmployeeDto,
  EmployeeLookup,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "./types";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    const details = (data as { details?: unknown }).details;
    const detailsText = details ? ` | ${JSON.stringify(details)}` : "";
    throw new Error((data.error || `Request failed: ${response.status}`) + detailsText);
  }

  return data;
}

export async function getEmployees(
  page = 1,
  limit = 10,
  search?: string,
  role?: string
): Promise<PaginatedResponse<EmployeeDto>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.set("search", search);
  if (role) params.set("role", role);

  const response = await fetchApi<PaginatedResponse<EmployeeDto>>(
    `/api/employees?${params.toString()}`
  );

  if (!response.data) {
    throw new Error(response.error || "Failed to fetch employees");
  }

  return response.data;
}

export async function getEmployeeById(id: string): Promise<EmployeeDto> {
  const response = await fetchApi<EmployeeDto>(`/api/employees/${id}`);
  if (!response.data) {
    throw new Error(response.error || "Failed to fetch employee");
  }
  return response.data;
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<EmployeeDto> {
  const response = await fetchApi<EmployeeDto>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.data) {
    throw new Error(response.error || "Failed to create employee");
  }

  return response.data;
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput
): Promise<EmployeeDto> {
  const response = await fetchApi<EmployeeDto>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!response.data) {
    throw new Error(response.error || "Failed to update employee");
  }

  return response.data;
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  const response = await fetchApi<{ success: boolean }>(`/api/employees/${id}`, {
    method: "DELETE",
  });

  if (!response.data) {
    return { success: true };
  }

  return response.data;
}

export async function getEmployeeLookup(): Promise<EmployeeLookup[]> {
  const response = await fetchApi<EmployeeLookup[]>("/api/employees/lookup");

  if (!response.data) {
    throw new Error(response.error || "Failed to fetch employee lookup");
  }

  return response.data;
}
