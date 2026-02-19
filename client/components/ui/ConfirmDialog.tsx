"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { useTranslation } from "@/lib/translation-context";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  /**
   * When provided, the user must type this exact word before the confirm
   * button becomes enabled. Defaults to undefined (no typed confirmation).
   * Example: confirmWord="DELETE"
   */
  confirmWord?: string;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmWord,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");

  // Reset typed value every time the dialog opens/closes
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const requiresTyping = Boolean(confirmWord);
  const isConfirmEnabled = requiresTyping ? typed === confirmWord : true;

  return (
    <Modal open={open} onClose={onClose} title={title ?? t("areYouSure")} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-card-red-light flex items-center justify-center">
          <AlertTriangle size={28} className="text-card-red" />
        </div>

        {/* Message */}
        <div className="space-y-1">
          <p className="text-text-secondary text-sm">
            {message ?? t("deleteConfirm")}
          </p>
          <p className="text-text-muted text-xs">{t("actionCannotBeUndone")}</p>
        </div>

        {/* Typed confirmation input */}
        {requiresTyping && (
          <div className="w-full text-start space-y-1.5">
            <label className="text-xs text-text-secondary">
              {t("typeToConfirm")}{" "}
              <span className="font-mono font-semibold text-card-red">
                {confirmWord}
              </span>
              {" "}{t("toContinue")}
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmWord}
              autoComplete="off"
              spellCheck={false}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-card-red/30 focus:border-card-red/60 transition-all"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 w-full pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-surface-border bg-surface text-text-secondary hover:bg-background transition-colors text-sm font-medium cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            disabled={!isConfirmEnabled}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 h-10 rounded-lg bg-card-red text-white text-sm font-medium border-0 transition-all
              enabled:hover:bg-card-red/90 enabled:cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
