"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/translation-context";
import { Modal } from "@/components/ui";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  onSave: (data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  }) => void;
}

export default function EditProfileModal({ open, onClose, data, onSave }: EditProfileModalProps) {
  const { t, dir: currentDir } = useTranslation();
  const [form, setForm] = useState(data);

  useEffect(() => {
    if (open) {
      setForm(data);
    }
  }, [open, data]);

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("editProfile")} maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("fullName")}</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("emailAddress")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("phoneNumber")}</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="ltr"
            style={{ textAlign: currentDir === 'rtl' ? 'right' : 'left' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("addressLabel")}</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.fullName || !form.email}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
