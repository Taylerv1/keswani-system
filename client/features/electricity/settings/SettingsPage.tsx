"use client";

import { useState, useEffect } from "react";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useElectricity } from "@/features/electricity/context/electricity-context";
import type { ElecSettings } from "@/features/electricity/types";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data, updateSettings } = useElectricity();
  const [form, setForm] = useState<ElecSettings>(data.settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(data.settings);
  }, [data.settings]);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("elecSettings")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("settingsDescription")}</p>
        </div>
        <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Save size={16} />
          {saved ? "✓" : t("saveSettings")}
        </button>
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-card-green-light text-card-green text-sm font-medium">{t("settingsSaved")}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency & General */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-card-blue-light text-card-blue flex items-center justify-center"><SettingsIcon size={16} /></div>
            <h2 className="text-sm font-semibold text-text-primary">{t("generalSettings")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("currency")}</label>
              <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        {/* Generator Info */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-card-orange-light text-card-orange flex items-center justify-center"><SettingsIcon size={16} /></div>
            <h2 className="text-sm font-semibold text-text-primary">{t("generatorInfo")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("generatorName")}</label>
              <input type="text" value={form.generatorName} onChange={(e) => setForm({ ...form, generatorName: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("generatorCapacity")}</label>
              <input type="text" value={form.generatorCapacity} onChange={(e) => setForm({ ...form, generatorCapacity: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("fuelType")}</label>
              <input type="text" value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        {/* Bill Settings */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-card-green-light text-card-green flex items-center justify-center"><SettingsIcon size={16} /></div>
            <h2 className="text-sm font-semibold text-text-primary">{t("billSettings")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("dueDateDays")}</label>
              <input type="number" min={1} value={form.billDueDays} onChange={(e) => setForm({ ...form, billDueDays: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("additionalFees")} ($)</label>
              <input type="number" min={0} step={0.01} value={form.additionalFees} onChange={(e) => setForm({ ...form, additionalFees: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        {/* PDF Settings */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-card-purple-light text-card-purple flex items-center justify-center"><SettingsIcon size={16} /></div>
            <h2 className="text-sm font-semibold text-text-primary">{t("pdfSettings")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("footerText")}</label>
              <input type="text" value={form.pdfFooterText} onChange={(e) => setForm({ ...form, pdfFooterText: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="showLogo" checked={form.pdfShowLogo} onChange={(e) => setForm({ ...form, pdfShowLogo: e.target.checked })} className="w-4 h-4 cursor-pointer accent-primary" />
              <label htmlFor="showLogo" className="text-sm text-text-primary cursor-pointer">{t("showLogo")}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="showQr" checked={form.pdfShowQr} onChange={(e) => setForm({ ...form, pdfShowQr: e.target.checked })} className="w-4 h-4 cursor-pointer accent-primary" />
              <label htmlFor="showQr" className="text-sm text-text-primary cursor-pointer">{t("showQrCode")}</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
