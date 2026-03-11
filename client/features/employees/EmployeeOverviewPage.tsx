// ============================================================
// Employee Module — Overview Page (Main)
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { LoadingLottie, SearchBar, Pagination, SelectMenu } from "@/components/ui";
import { useEmployeeState } from "./hooks";
import { EmployeeTable } from "./components/EmployeeTable";
import { EmployeeMobileCard } from "./components/EmployeeMobileCard";
import { EmployeeCreateModal } from "./components/EmployeeCreateModal";
import { EmployeeEditModal } from "./components/EmployeeEditModal";
import { EmployeeDeleteModal } from "./components/EmployeeDeleteModal";
import type { EmployeeDto } from "./types";

export function EmployeeOverviewPage() {
  const { t } = useTranslation();

  /* ------------------------------------------------------------------ */
  /* State & form hooks                                                  */
  /* ------------------------------------------------------------------ */

  const state = useEmployeeState(t);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    state.loadEmployees();
  }, [state.page, state.search, state.filterRole]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                            */
  /* ------------------------------------------------------------------ */

  const handleOpenCreate = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateModalOpen(false);
  };

  const handleOpenEdit = (employee: EmployeeDto) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleOpenDelete = (employee: EmployeeDto) => {
    if (employee.role === "owner") {
      state.setError(t("ownerCannotBeDeleted"));
      return;
    }
    setSelectedEmployee(employee);
    setDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleCreate = async (data: any) => {
    try {
      await state.createEmployeeItem(data);
      handleCloseCreate();
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await state.updateEmployeeItem(id, data);
      handleCloseEdit();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await state.deleteEmployeeItem(id);
      handleCloseDelete();
    } catch (err) {
      throw err;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users size={28} className="text-primary" />
            {t("employees")}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {state.totalItems} {t("totalEmployees")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin-dashboard/employees/salaries"
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:text-primary hover:border-primary/40 transition-colors flex items-center"
          >
            {t("salaryOverview")}
          </Link>
          <button
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addEmployee")}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={state.search}
            onChange={(v) => {
              state.setSearch(v);
              state.setPage(1);
            }}
            placeholder={t("searchEmployees")}
          />
        </div>
        <div className="sm:w-52">
          <SelectMenu
            value={state.filterRole}
            onChange={(value) => {
              state.setFilterRole(value);
              state.setPage(1);
            }}
            options={[
              { value: "", label: t("allRoles") },
              { value: "owner", label: t("owner") },
              { value: "admin", label: t("admin") },
              { value: "employee", label: t("employee") },
            ]}
            placeholder={t("filterByRole")}
            noResultsLabel={t("noResults") || "No roles found"}
          />
        </div>
      </div>

      {/* Desktop Table */}
      {state.loading && state.employees.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={140} className="p-6" />
        </div>
      ) : (
        <>
          <EmployeeTable
            employees={state.employees}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            isLoading={state.loading}
          />

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {state.employees.map((employee) => (
              <EmployeeMobileCard
                key={employee.id}
                employee={employee}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                isLoading={state.loading}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={state.page}
            totalPages={state.totalPages}
            totalItems={state.totalItems}
            pageSize={10}
            onPageChange={state.setPage}
          />
        </div>
      )}

      {/* Modals */}
      <EmployeeCreateModal
        open={createModalOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreate}
      />

      <EmployeeEditModal
        open={editModalOpen}
        employee={selectedEmployee}
        onClose={handleCloseEdit}
        onSubmit={handleEdit}
      />

      <EmployeeDeleteModal
        open={deleteModalOpen}
        employee={selectedEmployee}
        onClose={handleCloseDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default EmployeeOverviewPage;
