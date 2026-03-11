// ============================================================
// Employee Module — Hooks (State Management & API integration)
// ============================================================

import { useState, useCallback } from "react";
import type { EmployeeDto } from "./types";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./api";

interface UseEmployeeStateReturn {
  employees: EmployeeDto[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalItems: number;
  search: string;
  filterRole: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilterRole: (role: string) => void;
  loadEmployees: () => Promise<void>;
  createEmployeeItem: (data: any) => Promise<EmployeeDto>;
  updateEmployeeItem: (id: string, data: any) => Promise<EmployeeDto>;
  deleteEmployeeItem: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export function useEmployeeState(t: any): UseEmployeeStateReturn {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployees(
        page,
        10,
        search || undefined,
        filterRole || undefined,
      );
      setEmployees(response.items);
      setTotalPages(response.pagination.total_pages);
      setTotalItems(response.pagination.total);
    } catch (err: any) {
      setError(err.message || t("failedToLoadEmployees"));
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, t]);

  const createEmployeeItem = useCallback(
    async (data: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createEmployee(data);
        await loadEmployees();
        return result;
      } catch (err: any) {
        setError(err.message || t("failedToCreateEmployee"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadEmployees, t],
  );

  const updateEmployeeItem = useCallback(
    async (id: string, data: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await updateEmployee(id, data);
        await loadEmployees();
        return result;
      } catch (err: any) {
        setError(err.message || t("failedToUpdateEmployee"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadEmployees, t],
  );

  const deleteEmployeeItem = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteEmployee(id);
        await loadEmployees();
      } catch (err: any) {
        setError(err.message || t("failedToDeleteEmployee"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadEmployees, t],
  );

  return {
    employees,
    loading,
    error,
    page,
    totalPages,
    totalItems,
    search,
    filterRole,
    setPage,
    setSearch,
    setFilterRole,
    loadEmployees,
    createEmployeeItem,
    updateEmployeeItem,
    deleteEmployeeItem,
    setError,
  };
}
