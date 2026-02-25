import { ConfirmDialog } from "@/components/ui";

interface MaintenanceDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MaintenanceDeleteModal({
  open,
  onClose,
  onConfirm,
}: MaintenanceDeleteModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmWord="DELETE"
    />
  );
}
