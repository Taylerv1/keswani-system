// ============================================================
// Property Module — Delete Confirmation Dialog
// ============================================================

import { ConfirmDialog } from "@/components/ui";

interface PropertyDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PropertyDeleteModal({
  open,
  onClose,
  onConfirm,
}: PropertyDeleteModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmWord="DELETE"
    />
  );
}
