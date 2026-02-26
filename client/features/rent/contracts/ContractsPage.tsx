"use client";

import { useMemo } from "react";
import { Plus, Trash2, FileDown, FileText, Download, Eye } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  SearchBar,
  StatusBadge,
  Pagination,
  Modal,
  ConfirmDialog,
  LoadingLottie,
  SelectMenu,
  type SelectOption,
} from "@/components/ui";
import { useContractForm, useContractState } from "./hooks";
import { formatDateOnly, getDaysRemaining, toNumber } from "./utils";

export default function ContractsPage() {
  const { t } = useTranslation();

  const state = useContractState(t);
  const form = useContractForm({
    t,
    createContractItem: state.createContractItem,
    deleteContractItem: state.deleteContractItem,
    createClientItem: state.createClientItem,
    properties: state.properties,
    setError: state.setError,
  });

  const selectedPropertyUnits = useMemo(() => {
    if (!form.form.property_id) return [];
    const property = state.propertyById.get(form.form.property_id);
    return property?.units ?? [];
  }, [form.form.property_id, state.propertyById]);

  const tenantOptions = useMemo(
    () =>
      state.clients.map((tenant) => ({
        value: tenant.id,
        label: tenant.full_name,
      })),
    [state.clients]
  );

  const propertyOptions = useMemo(
    () =>
      state.properties.map((property) => ({
        value: property.id,
        label: property.name,
      })),
    [state.properties]
  );

  const statusFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: `${t("all")} - ${t("status")}` },
      { value: "active", label: t("active") },
      { value: "expired", label: t("expired") },
      { value: "terminated", label: t("terminated") },
    ],
    [t]
  );

  const contractStatusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "pending", label: t("pending") },
      { value: "active", label: t("active") },
      { value: "expired", label: t("expired") },
      { value: "terminated", label: t("terminated") },
    ],
    [t]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("contractManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{state.totalItems} {t("rentContracts")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium flex items-center gap-2 opacity-60 cursor-not-allowed">
            <FileDown size={16} />
            {t("comingSoon")}
          </button>
          <button onClick={form.openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("addContract")}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={state.search} onChange={(v) => { state.setSearch(v); state.setPage(1); }} />
        </div>
        <div className="sm:w-52">
          <SelectMenu
            value={state.statusFilter}
            onChange={(value) => {
              state.setStatusFilter(value as "all" | "active" | "expired" | "terminated");
              state.setPage(1);
            }}
            options={statusFilterOptions}
            placeholder={`${t("all")} - ${t("status")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
      </div>

      {state.loading || state.lookupLoading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center" role="status" aria-live="polite">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        {/* Desktop table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("contractId")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenant")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("monthlyRent")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("endDate")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {state.contracts.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                state.contracts.map((c) => {
                  const days = getDaysRemaining(c.end_date);
                  const ending = c.status === "active" && days <= 60 && days > 0;
                  return (
                    <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-text-muted" />
                          <span className="font-medium text-text-primary">{c.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{c.client_name}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {c.property_name} - {c.unit_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">${toNumber(c.monthly_rent).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-text-secondary">{formatDateOnly(c.end_date)}</span>
                        {ending && (
                          <span className="block text-xs text-card-orange font-medium mt-0.5">
                            {days} {t("daysRemaining")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                        {ending && (
                          <span className="ms-1">
                            <StatusBadge status="endingSoon" variant="warning" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => form.openView(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("view")}>
                            <Eye size={15} />
                          </button>
                          
                          <button onClick={() => form.setDeleteId(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 p-3">
          {state.contracts.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">{t("noResults")}</div>
          ) : (
            state.contracts.map((c) => (
              <div key={c.id} className="bg-surface rounded-xl border border-surface-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-text-primary">{c.client_name}</div>
                    <div className="text-xs text-text-secondary">{c.property_name} - {c.unit_number}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
                  <div>
                    <div className="text-[11px]">{t("startDate")}</div>
                    <div className="font-medium text-text-primary">{formatDateOnly(c.start_date)}</div>
                  </div>
                  <div>
                    <div className="text-[11px]">{t("endDate")}</div>
                    <div className="font-medium text-text-primary">{formatDateOnly(c.end_date)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => form.openView(c)} className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-blue hover:border-card-blue transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Eye size={14} />
                    {t("view")}
                  </button>
                  
                  <button onClick={() => form.setDeleteId(c.id)} className="h-9 px-3 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Trash2 size={14} />
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      <Pagination currentPage={state.page} totalPages={state.totalPages} totalItems={state.totalItems} pageSize={state.PAGE_SIZE} onPageChange={state.setPage} />

      {/* Add Modal */}
      <Modal open={form.modalOpen} onClose={form.closeModal} title={t("addContract")} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("tenant")}</label>
              <SelectMenu
                value={form.form.client_id}
                options={tenantOptions}
                onChange={(value) => form.setForm({ ...form.form, client_id: value })}
                placeholder="--"
                searchable
                searchPlaceholder={`${t("search")}...`}
                noResultsLabel={t("noResults")}
                addActionLabel={t("addTenant")}
                onAddAction={form.openCreateClientModal}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("property")}</label>
              <SelectMenu
                value={form.form.property_id}
                options={propertyOptions}
                onChange={(value) => form.onPropertyChange(value)}
                placeholder="--"
                searchable
                searchPlaceholder={`${t("search")}...`}
                noResultsLabel={t("noResults")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("unitNumber")}</label>
              <SelectMenu
                value={form.form.unit_id}
                onChange={(value) => form.setForm({ ...form.form, unit_id: value })}
                options={selectedPropertyUnits.map((unit) => ({
                  value: unit.id,
                  label: unit.unit_number,
                }))}
                placeholder="--"
                noResultsLabel={t("noResults")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("startDate")}</label>
              <input type="date" value={form.form.start_date} onChange={(e) => form.setForm({ ...form.form, start_date: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("endDate")}</label>
              <input type="date" value={form.form.end_date} onChange={(e) => form.setForm({ ...form.form, end_date: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("monthlyRent")}</label>
              <input type="number" min={0} value={form.form.monthly_rent} onChange={(e) => form.setForm({ ...form.form, monthly_rent: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("deposit")}</label>
              <input type="number" min={0} value={form.form.deposit_amount} onChange={(e) => form.setForm({ ...form.form, deposit_amount: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <SelectMenu
                value={form.form.status}
                onChange={(value) =>
                  form.setForm({
                    ...form.form,
                    status: value as "pending" | "active" | "expired" | "terminated",
                  })
                }
                options={contractStatusOptions}
                placeholder="--"
                noResultsLabel={t("noResults")}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("notes")}</label>
            <textarea value={form.form.notes} onChange={(e) => form.setForm({ ...form.form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={form.closeModal} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button disabled={state.actionLoading} onClick={() => { void form.handleSave(); }} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed">{state.actionLoading ? t("loading") : t("save")}</button>
          </div>
        </div>
      </Modal>

      {/* Quick Add Tenant Modal */}
      <Modal
        open={form.createClientModalOpen}
        onClose={form.closeCreateClientModal}
        title={t("addTenant")}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("tenantName")}
            </label>
            <input
              value={form.createClientForm.full_name}
              onChange={(e) =>
                form.setCreateClientForm({
                  ...form.createClientForm,
                  full_name: e.target.value,
                })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("email")}
              </label>
              <input
                type="email"
                value={form.createClientForm.email}
                onChange={(e) =>
                  form.setCreateClientForm({
                    ...form.createClientForm,
                    email: e.target.value,
                  })
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("phone")}
              </label>
              <input
                value={form.createClientForm.phone}
                onChange={(e) =>
                  form.setCreateClientForm({
                    ...form.createClientForm,
                    phone: e.target.value,
                  })
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("notes")}
            </label>
            <textarea
              value={form.createClientForm.notes}
              onChange={(e) =>
                form.setCreateClientForm({
                  ...form.createClientForm,
                  notes: e.target.value,
                })
              }
              rows={4}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={form.closeCreateClientModal}
              disabled={state.actionLoading}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                void form.handleCreateClient();
              }}
              disabled={state.actionLoading}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.actionLoading ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!form.detailItem} onClose={form.closeView} title={t("contractDetails")} maxWidth="max-w-lg">
        {form.detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("contractId")}</p>
                <p className="text-sm font-medium text-text-primary">{form.detailItem.id}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("status")}</p>
                <StatusBadge status={form.detailItem.status} />
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("tenant")}</p>
                <p className="text-sm font-medium text-text-primary">{form.detailItem.client_name}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("property")}</p>
                <p className="text-sm font-medium text-text-primary">{form.detailItem.property_name} - {form.detailItem.unit_number}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("startDate")}</p>
                <p className="text-sm font-medium text-text-primary">{formatDateOnly(form.detailItem.start_date)}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("endDate")}</p>
                <p className="text-sm font-medium text-text-primary">{formatDateOnly(form.detailItem.end_date)}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("monthlyRent")}</p>
                <p className="text-sm font-medium text-text-primary">${toNumber(form.detailItem.monthly_rent).toLocaleString()}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("deposit")}</p>
                <p className="text-sm font-medium text-text-primary">${toNumber(form.detailItem.deposit_amount).toLocaleString()}</p>
              </div>
              <div className="bg-background rounded-lg p-3 col-span-2">
                <p className="text-xs text-text-muted">{t("notes")}</p>
                <p className="text-sm font-medium text-text-primary">{form.detailItem.notes || "—"}</p>
              </div>
            </div>
            <button disabled className="w-full h-10 rounded-lg border border-surface-border text-text-secondary opacity-60 cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2 bg-transparent">
              <Download size={16} />
              {t("comingSoon")}
            </button>
            
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!form.deleteId} onClose={() => form.setDeleteId(null)} onConfirm={async () => { await form.handleDelete(); }} loading={state.actionLoading} confirmWord="DELETE" />
    </div>
  );
}
