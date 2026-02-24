// ============================================================
// Property Module — Delete Confirmation Dialog
// ============================================================

import { ConfirmDialog } from "@/components/ui";

interface PropertyDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function PropertyDeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
}: PropertyDeleteModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      confirmWord="DELETE"
    />
  );
}
