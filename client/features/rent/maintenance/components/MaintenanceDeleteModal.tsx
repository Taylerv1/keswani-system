import { ConfirmDialog } from "@/components/ui";
import { useTranslation } from "@/lib/translation";

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
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      confirmWord={t("delete")}
    />
  );
}
