// ============================================================
// Employee Delete Confirmation Modal
// ============================================================

"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, LoadingLottie } from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import type { EmployeeDto } from "../types";

interface EmployeeDeleteModalProps {
  open: boolean;
  employee: EmployeeDto | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function EmployeeDeleteModal({
  open,
  employee,
  onClose,
  onConfirm,
}: EmployeeDeleteModalProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!employee) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(employee.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("deleteEmployee")}
      maxWidth="max-w-md"
      showClose={!isDeleting}
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 p-3">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-text-primary font-semibold">
            {t("areYouSure")}
          </p>
          <p className="text-text-secondary text-sm">
            This will permanently delete <strong>{employee.full_name}</strong> along with all associated data.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-surface-border text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isDeleting && <LoadingLottie size="sm" />}
            {t("delete")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
