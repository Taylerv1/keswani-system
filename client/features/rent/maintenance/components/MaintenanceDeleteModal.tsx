import { ConfirmDialog } from "@/components/ui";
import { useTranslation } from "@/lib/translation";

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
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmWord={t("cancel")}
    />
  );
}
