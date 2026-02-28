import { ConfirmDialog } from "@/components/ui";

interface MaintenanceDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function MaintenanceDeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
}: MaintenanceDeleteModalProps) {
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
