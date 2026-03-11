// ============================================================
// Employee Edit Modal Component
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { Modal, LoadingLottie } from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import type { EmployeeDto, UpdateEmployeeInput, EmployeeRole } from "../types";
import { isShallowDirty } from "@/lib/formDirty";

interface EmployeeEditModalProps {
  open: boolean;
  employee: EmployeeDto | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateEmployeeInput) => Promise<void>;
}

export function EmployeeEditModal({
  open,
  employee,
  onClose,
  onSubmit,
}: EmployeeEditModalProps) {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    role: "employee" as EmployeeRole,
    salary_amount: 0,
    is_active: true,
  });
  const [initialState, setInitialState] = useState<typeof formState | null>(null);

  useEffect(() => {
    if (employee && open) {
      const nextState = {
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        role: employee.role,
        salary_amount: employee.salary_amount ?? 0,
        is_active: employee.is_active,
      };

      setInitialState(nextState);
      setFormState(nextState);
    }
  }, [employee, open]);

  const isDirty = initialState ? isShallowDirty(initialState, formState) : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormState((prev) => ({
      ...prev,
      [name]:
        name === "salary_amount"
          ? Number(value)
          : type === "checkbox"
            ? checked
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setActionLoading(true);
    setError(null);

    try {
      await onSubmit(employee.id, {
        full_name: formState.full_name,
        email: formState.email,
        phone: formState.phone,
        address: formState.address,
        role: formState.role,
        salary_amount: Number(formState.salary_amount) || 0,
        is_active: formState.is_active,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update employee");
    } finally {
      setActionLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("editEmployee")}
      maxWidth="max-w-2xl"
      showClose={!actionLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t("fullName")}
          </label>
          <input
            type="text"
            name="full_name"
            value={formState.full_name}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t("email")}
          </label>
          <input
            type="email"
            name="email"
            value={formState.email}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t("phone")}
          </label>
          <input
            type="tel"
            name="phone"
            value={formState.phone}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t("address")}
          </label>
          <input
            type="text"
            name="address"
            value={formState.address}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t("role")}
          </label>
          <select
            name="role"
            value={formState.role}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            <option value="employee">{t("roleEmployee")}</option>
            <option value="admin">{t("roleAdmin")}</option>
            <option value="owner">{t("roleOwner")}</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formState.is_active}
              onChange={handleChange}
              disabled={actionLoading}
              className="w-4 h-4 rounded border-surface-border cursor-pointer"
            />
            <span className="text-sm font-medium text-text-primary">
              {t("active")}
            </span>
          </label>
        </div>

        {/* Monthly Salary */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t("monthlySalary")}
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            name="salary_amount"
            value={formState.salary_amount}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg border border-surface-border text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer"
          >
            {t("cancel")}
          </button>
	          <button
	            type="submit"
	            disabled={actionLoading || !isDirty}
	            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
	          >
	            {actionLoading && <LoadingLottie size={20} />}
	            {t("save")}
	          </button>
	        </div>
	      </form>
    </Modal>
  );
}
