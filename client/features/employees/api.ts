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

export interface EmployeeSalaryOverviewMonthlyItem {
  month: string;
  rent_income: number;
  electricity_income: number;
  total_income: number;
  payroll_cost: number;
  net_earning: number;
}

export interface EmployeeSalaryOverviewResponse {
  range: {
    from_month: string;
    to_month: string;
  };
  summary: {
    active_employees: number;
    monthly_payroll: number;
    total_income: number;
    total_payroll: number;
    net_earning: number;
  };
  employees: Array<{
    id: string;
    full_name: string;
    role: string;
    is_active: boolean;
    salary_amount: number;
  }>;
  monthly: EmployeeSalaryOverviewMonthlyItem[];
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

export async function getEmployeeSalaryOverview(): Promise<EmployeeSalaryOverviewResponse> {
  const response = await fetchApi<EmployeeSalaryOverviewResponse>(
    "/api/employees/salary-overview"
  );

  if (!response.data) {
    throw new Error(response.error || "Failed to fetch salary overview");
  }

  return response.data;
}
