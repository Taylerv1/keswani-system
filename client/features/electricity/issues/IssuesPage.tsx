"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  ConfirmDialog,
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
  SelectMenu,
  StatusBadge,
} from "@/components/ui";
import { issuesStore } from "./store";
import type { IssueFormData } from "./types";
import {
  getCategoryTranslationKey,
  getPriorityColor,
  getStatusTranslationKey,
  getPriorityTranslationKey,
} from "./utils";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void issuesStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US");
}

export default function IssuesPage() {
  const { t, locale } = useTranslation();
  const store = issuesStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("issuesManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {store.totalItems} {t("elecIssues")}
          </p>
        </div>
        <button
          onClick={store.openAdd}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus size={16} />
          {t("addIssue")}
        </button>
      </div>

      {/* Flash messages */}
      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}
      {store.success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {store.success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={store.search}
            onChange={(value) => {
              store.setSearch(value);
              void store.loadIssues({ errorFallback: t("error") });
            }}
          />
        </div>
        <div className="sm:w-44">
          <SelectMenu
            value={store.filterStatus}
            onChange={(value) => {
              store.setFilterStatus(value as typeof store.filterStatus);
              void store.loadIssues({ errorFallback: t("error") });
            }}
            options={[
              { value: "all", label: `${t("all")} - ${t("issueStatus")}` },
              { value: "open", label: t("issueStatusOpen") },
              { value: "in_progress", label: t("issueStatusInProgress") },
              { value: "resolved", label: t("issueStatusResolved") },
              { value: "closed", label: t("issueStatusClosed") },
            ]}
            placeholder={`${t("all")} - ${t("issueStatus")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
        <div className="sm:w-44">
          <SelectMenu
            value={store.filterPriority}
            onChange={(value) => {
              store.setFilterPriority(value as typeof store.filterPriority);
              void store.loadIssues({ errorFallback: t("error") });
            }}
            options={[
              { value: "all", label: `${t("all")} - ${t("issuePriority")}` },
              { value: "high", label: t("issuePriorityHigh") },
              { value: "medium", label: t("issuePriorityMedium") },
              { value: "low", label: t("issuePriorityLow") },
            ]}
            placeholder={`${t("all")} - ${t("issuePriority")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
        <div className="sm:w-44">
          <SelectMenu
            value={store.filterCategory}
            onChange={(value) => {
              store.setFilterCategory(value as typeof store.filterCategory);
              void store.loadIssues({ errorFallback: t("error") });
            }}
            options={[
              { value: "all", label: `${t("all")} - ${t("issueCategory")}` },
              { value: "billing", label: t("issueCategoryBilling") },
              { value: "meter", label: t("issueCategoryMeter") },
              { value: "connection", label: t("issueCategoryConnection") },
              { value: "other", label: t("issueCategoryOther") },
            ]}
            placeholder={`${t("all")} - ${t("issueCategory")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
      </div>

      {/* Table / Cards */}
      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("title")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("issueCategory")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("issuePriority")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("issueStatus")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("assignedTo")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("createdAt")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {store.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  store.items.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-text-muted shrink-0" />
                          <div>
                            <p className="font-medium text-text-primary">{issue.title}</p>
                            <p className="text-xs text-text-muted truncate max-w-[200px]">{issue.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-text-secondary">{issue.clientName}</p>
                          <p className="text-xs text-text-muted">{issue.subscriptionNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-card-blue-light text-card-blue">
                          {t(getCategoryTranslationKey(issue.category))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`} />
                          <StatusBadge status={issue.priority} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {issue.assigneeName || t("unassigned")}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{issue.createdAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => store.openView(issue)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("view")}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => store.openEdit(issue)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("edit")}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => store.setDeleteId(issue.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("delete")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-surface-border">
            {store.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
            ) : (
              store.items.map((issue) => (
                <div key={issue.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-card-orange-light text-card-orange flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-text-primary">{issue.title}</div>
                        <div className="text-xs text-text-secondary truncate">{issue.description}</div>
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary">{issue.createdAt}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
                    <div>
                      <div className="text-[11px]">{t("subscriber")}</div>
                      <div className="font-medium text-text-primary">{issue.clientName}</div>
                    </div>
                    <div>
                      <div className="text-[11px]">{t("issueCategory")}</div>
                      <div className="font-medium text-text-primary">
                        {t(getCategoryTranslationKey(issue.category))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px]">{t("issuePriority")}</div>
                      <div className="font-medium text-text-primary">{t(getPriorityTranslationKey(issue.priority))}</div>
                    </div>
                    <div>
                      <div className="text-[11px]">{t("issueStatus")}</div>
                      <div className="font-medium text-text-primary">{t(getStatusTranslationKey(issue.status))}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => store.openView(issue)}
                      className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-blue hover:border-card-blue transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Eye size={14} />
                      {t("view")}
                    </button>
                    <button
                      onClick={() => store.openEdit(issue)}
                      className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Pencil size={14} />
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => store.setDeleteId(issue.id)}
                      className="h-9 px-3 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
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

      {/* Pagination */}
      <Pagination
        currentPage={store.page}
        totalPages={store.totalPages}
        totalItems={store.totalItems}
        pageSize={store.PAGE_SIZE}
        onPageChange={(nextPage) => {
          store.setPage(nextPage);
          void store.loadIssues({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={store.modalOpen}
        onClose={store.closeModal}
        title={store.editItem ? t("editIssue") : t("addIssue")}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("subscriber")}
            </label>
            <SelectMenu
              value={store.form.subscriberId}
              onChange={(value) => store.setForm((prev) => ({ ...prev, subscriberId: value }))}
              menuMaxHeight={190}
              options={store.subscriberOptions.map((s) => ({
                value: s.id,
                label: `${s.clientName} — ${s.subscriptionNumber}`,
              }))}
              placeholder="--"
              searchable
              searchPlaceholder={`${t("search")}...`}
              noResultsLabel={t("noResults")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("title")}
            </label>
            <input
              value={store.form.title}
              onChange={(e) => store.setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("description")}
            </label>
            <textarea
              value={store.form.description}
              onChange={(e) => store.setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("issueCategory")}
              </label>
              <SelectMenu
                value={store.form.category}
                onChange={(value) => store.setForm((prev) => ({ ...prev, category: value as IssueFormData["category"] }))}
                menuMaxHeight={190}
                options={[
                  { value: "billing", label: t("issueCategoryBilling") },
                  { value: "meter", label: t("issueCategoryMeter") },
                  { value: "connection", label: t("issueCategoryConnection") },
                  { value: "other", label: t("issueCategoryOther") },
                ]}
                placeholder="--"
                noResultsLabel={t("noResults")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("issuePriority")}
              </label>
              <SelectMenu
                value={store.form.priority}
                onChange={(value) => store.setForm((prev) => ({ ...prev, priority: value as IssueFormData["priority"] }))}
                menuMaxHeight={190}
                options={[
                  { value: "high", label: t("issuePriorityHigh") },
                  { value: "medium", label: t("issuePriorityMedium") },
                  { value: "low", label: t("issuePriorityLow") },
                ]}
                placeholder="--"
                noResultsLabel={t("noResults")}
              />
            </div>
          </div>

          {/* Status + Assigned To — only shown in edit mode */}
          {store.editItem && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("issueStatus")}
                </label>
                <SelectMenu
                  value={store.form.status}
                  onChange={(value) => store.setForm((prev) => ({ ...prev, status: value as IssueFormData["status"] }))}
                  menuMaxHeight={190}
                  options={[
                    { value: "open", label: t("issueStatusOpen") },
                    { value: "in_progress", label: t("issueStatusInProgress") },
                    { value: "resolved", label: t("issueStatusResolved") },
                    { value: "closed", label: t("issueStatusClosed") },
                  ]}
                  placeholder="--"
                  noResultsLabel={t("noResults")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("assignedTo")}
                </label>
                <SelectMenu
                  value={store.form.assignedTo}
                  onChange={(value) => store.setForm((prev) => ({ ...prev, assignedTo: value }))}
                  menuMaxHeight={190}
                  options={[
                    { value: "", label: t("unassigned") },
                    ...store.employeeOptions.map((e) => ({
                      value: e.id,
                      label: e.fullName,
                    })),
                  ]}
                  placeholder="--"
                  searchable
                  searchPlaceholder={`${t("search")}...`}
                  noResultsLabel={t("noResults")}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={store.closeModal}
              disabled={store.actionLoading}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t("cancel")}
            </button>
	            <button
	              onClick={() =>
	                void store.save({
	                  titleRequiredMessage: `${t("title")} ${t("isRequired")}`,
	                  subscriberRequiredMessage: `${t("subscriber")} ${t("isRequired")}`,
	                  createdSuccessMessage: t("issueCreatedSuccess"),
	                  updatedSuccessMessage: t("issueUpdatedSuccess"),
	                  errorFallback: t("error"),
	                })
	              }
	              disabled={store.actionLoading || (Boolean(store.editItem) && !store.isEditDirty)}
	              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
	            >
	              {store.actionLoading ? <LoadingLottie size={28} /> : t("save")}
	            </button>
	          </div>
	        </div>
	      </Modal>

      {/* View Modal */}
      <Modal
        open={Boolean(store.viewItem)}
        onClose={store.closeView}
        title={t("viewIssue")}
        maxWidth="max-w-xl"
      >
        {store.viewItem && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{store.viewItem.title}</h3>
              <p className="text-sm text-text-secondary mt-1">{store.viewItem.description || "-"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("issueStatus")}</p>
                <div className="mt-1">
                  <StatusBadge status={store.viewItem.status} />
                </div>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("issuePriority")}</p>
                <div className="mt-1">
                  <StatusBadge status={store.viewItem.priority} />
                </div>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("issueCategory")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {t(getCategoryTranslationKey(store.viewItem.category))}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("subscriber")}</p>
                <p className="text-sm font-medium text-text-primary">{store.viewItem.clientName}</p>
                <p className="text-xs text-text-muted">{store.viewItem.subscriptionNumber}</p>
              </div>
              {store.viewItem.propertyName && (
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{t("property")}</p>
                  <p className="text-sm font-medium text-text-primary">
                    {store.viewItem.propertyName}
                    {store.viewItem.unitNumber ? ` - ${store.viewItem.unitNumber}` : ""}
                  </p>
                </div>
              )}
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("assignedTo")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {store.viewItem.assigneeName || t("unassigned")}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("createdAt")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(store.viewItem.createdAt, locale)}
                </p>
              </div>
              {store.viewItem.resolvedAt && (
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{t("resolvedAt")}</p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDate(store.viewItem.resolvedAt, locale)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={store.closeView}
                className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer"
              >
                {t("close")}
              </button>
              <button
                onClick={() => {
                  const item = store.viewItem;
                  store.closeView();
                  if (item) store.openEdit(item);
                }}
                className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0"
              >
                {t("edit")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(store.deleteId)}
        onClose={() => store.setDeleteId(null)}
        onConfirm={() =>
          void store.removeSelected({
            errorFallback: t("error"),
            successMessage: t("issueDeletedSuccess"),
          })
        }
        loading={store.actionLoading}
        title={t("deleteIssue")}
        message={t("deleteIssueConfirm")}
        confirmWord={t("delete")}
        confirmLabel={t("delete")}
      />
    </div>
  );
}
