// ============================================================
// Employee Module — Types
// ============================================================

export type EmployeeRole = "owner" | "admin" | "employee";

export interface EmployeeAccessPermissions {
  rent: boolean;
  electricity: boolean;
  expenses: boolean;
  employees: boolean;
  clients: boolean;
}

export interface EmployeeDto {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: EmployeeRole;
  access: EmployeeAccessPermissions;
  salary_amount: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeInput {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: EmployeeRole;
  salary_amount?: number;
}

export interface UpdateEmployeeInput {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: EmployeeRole;
  salary_amount?: number;
  access?: EmployeeAccessPermissions;
  is_active?: boolean;
}

export interface EmployeeLookup {
  id: string;
  full_name: string;
  email: string;
}
