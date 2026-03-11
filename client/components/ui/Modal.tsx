"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  showClose?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (showClose) onClose();
        }}
      />
      {/* Content */}
      <div
        className={`relative bg-surface rounded-xl shadow-xl w-full ${maxWidth} mx-4 max-h-[90vh] flex flex-col animate-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {showClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-background transition-colors cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {/* Body */}
        <div className="scrollbar-primary px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
