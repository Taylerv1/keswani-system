"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { useTranslation } from "@/lib/translation-context";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={title ?? t("areYouSure")} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-card-red-light flex items-center justify-center">
          <AlertTriangle size={28} className="text-card-red" />
        </div>
        <p className="text-text-secondary text-sm">
          {message ?? t("deleteConfirm")}
        </p>
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-surface-border bg-surface text-text-secondary hover:bg-background transition-colors text-sm font-medium cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 h-10 rounded-lg bg-card-red text-white hover:bg-card-red/90 transition-colors text-sm font-medium cursor-pointer border-0"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
