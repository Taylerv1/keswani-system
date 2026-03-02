// ============================================================
// Employee Module — API Layer (via Next.js /api proxy)
// ⚠️  USING MOCK DATA — Backend routes not implemented yet
// To switch to real API: Replace MOCK_MODE = true with false
// ============================================================

import mockEmployeesData from "@/mocks/employees.mock.json";

import type {
  EmployeeDto,
  EmployeeLookup,
  EmployeeRole,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "./types";

export type {
  EmployeeDto,
  EmployeeLookup,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "./types";

// Mock data storage (for create/update/delete operations)
let mockEmployees = [...mockEmployeesData.employees];

// Toggle mock mode: set to false when backend API is ready
const MOCK_MODE = true;

// --------------- Generic API response wrappers ---------------

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

// --------------- Internal fetch helper ---------------

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // Check if the response is JSON
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Expected JSON response but got ${contentType || "HTML"}. Status: ${res.status}. The API endpoint may not be implemented yet.`,
    );
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error! status: ${res.status}`);
  }
  return data;
}

// --------------- Employee CRUD Operations ---------------

/** Fetch all employees with pagination and filtering */
export async function getEmployees(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
): Promise<PaginatedResponse<EmployeeDto>> {
  if (MOCK_MODE) {
    // Mock implementation
    let filtered = [...mockEmployees];

    // Filter by search (name or email)
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(lowerSearch) ||
          emp.email.toLowerCase().includes(lowerSearch),
      );
    }

    // Filter by role
    if (role) {
      filtered = filtered.filter((emp) => emp.role === role);
    }

    // Paginate
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const items = filtered.slice(startIdx, endIdx);
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);

    return {
      items: items as EmployeeDto[],
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };
  }

  // Real API call (when backend is ready)
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && { role }),
  });

  const response = await fetchApi<PaginatedResponse<EmployeeDto>>(
    `/api/employees?${params}`,
  );

  if (!response.data) {
    throw new Error(response.error || "Failed to fetch employees");
  }

  return response.data;
}

/** Fetch employee by ID */
export async function getEmployeeById(id: string): Promise<EmployeeDto> {
  if (MOCK_MODE) {
    const employee = mockEmployees.find((emp) => emp.id === id);
    if (!employee) {
      throw new Error(`Employee with ID ${id} not found`);
    }
    return employee as EmployeeDto;
  }

  const response = await fetchApi<EmployeeDto>(`/api/employees/${id}`);
  if (!response.data) {
    throw new Error(response.error || "Failed to fetch employee");
  }
  return response.data;
}

/** Create new employee */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<EmployeeDto> {
  if (MOCK_MODE) {
    // Generate a simple UUID-like ID
    const newId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEmployee: EmployeeDto = {
      id: newId,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || "",
      address: input.address || "",
      role: input.role || "employee",
      is_active: true,
      access: {
        rent: false,
        electricity: false,
        expenses: false,
        employees: false,
        clients: false,
      },
    };
    mockEmployees.push(newEmployee);
    return newEmployee;
  }

  const response = await fetchApi<EmployeeDto>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.data) {
    throw new Error(response.error || "Failed to create employee");
  }

  return response.data;
}

/** Update employee */
export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeDto> {
  if (MOCK_MODE) {
    const index = mockEmployees.findIndex((emp) => emp.id === id);
    if (index === -1) {
      throw new Error(`Employee with ID ${id} not found`);
    }

    const existing = mockEmployees[index];
    // Update employee object
    const updated: EmployeeDto = {
      id: existing.id,
      full_name: input.full_name ?? existing.full_name,
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      address: input.address ?? existing.address,
      role: (input.role ?? existing.role) as EmployeeRole,
      access: input.access ?? existing.access,
      is_active: input.is_active ?? existing.is_active,
    };
    mockEmployees[index] = updated;
    return updated;
  }

  const response = await fetchApi<EmployeeDto>(`/api/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  if (!response.data) {
    throw new Error(response.error || "Failed to update employee");
  }

  return response.data;
}

/** Delete employee */
export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  if (MOCK_MODE) {
    const index = mockEmployees.findIndex((emp) => emp.id === id);
    if (index === -1) {
      throw new Error(`Employee with ID ${id} not found`);
    }
    mockEmployees.splice(index, 1);
    return { success: true };
  }

  const response = await fetchApi<{ success: boolean }>(
    `/api/employees/${id}`,
    {
      method: "DELETE",
    },
  );

  if (!response.data) {
    throw new Error(response.error || "Failed to delete employee");
  }

  return response.data;
}

/** Fetch employee lookup list (id, full_name, email) */
export async function getEmployeeLookup(): Promise<EmployeeLookup[]> {
  if (MOCK_MODE) {
    return mockEmployees.map((emp) => ({
      id: emp.id,
      full_name: emp.full_name,
      email: emp.email,
    }));
  }

  const response = await fetchApi<EmployeeLookup[]>("/api/employees/lookup");

  if (!response.data) {
    throw new Error(response.error || "Failed to fetch employee lookup");
  }

  return response.data;
}
