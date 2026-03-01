// ============================================================
// Property Module — Delete Confirmation Dialog
// ============================================================

import { ConfirmDialog } from "@/components/ui";
import { useTranslation } from "@/lib/translation";

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
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      confirmWord={t("cancel")}
    />
  );
}
