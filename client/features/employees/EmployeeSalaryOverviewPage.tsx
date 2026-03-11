"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, DollarSign, Wallet } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { KpiCard, LoadingLottie } from "@/components/ui";
import { getEmployeeSalaryOverview, type EmployeeSalaryOverviewResponse } from "./api";

function MoneyBarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ month: string; value: number }>;
  color: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
      <div className="flex items-end gap-3 h-44">
        {data.map((item) => (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-text-muted">
              {item.value > 0 ? item.value.toFixed(0) : ""}
            </span>
            <div
              className={`w-full rounded-t-md ${color}`}
              style={{
                height: `${item.value > 0 ? (item.value / maxValue) * 100 : 2}%`,
                minHeight: 4,
              }}
            />
            <span className="text-xs text-text-secondary">{item.month.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeSalaryOverviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<EmployeeSalaryOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getEmployeeSalaryOverview();
        if (!mounted) return;
        setData(response);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : t("error"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [t]);

  const incomeTrend = useMemo(
    () =>
      (data?.monthly ?? []).map((item) => ({
        month: item.month,
        value: item.total_income,
      })),
    [data?.monthly]
  );

  const payrollTrend = useMemo(
    () =>
      (data?.monthly ?? []).map((item) => ({
        month: item.month,
        value: item.payroll_cost,
      })),
    [data?.monthly]
  );

  const netTrend = useMemo(
    () =>
      (data?.monthly ?? []).map((item) => ({
        month: item.month,
        value: item.net_earning,
      })),
    [data?.monthly]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            {t("salaryOverview")}
          </h1>
          <p className="text-text-secondary text-sm mt-1">{t("salaryOverviewDescription")}</p>
        </div>
        <Link
          href="/admin-dashboard/employees"
          className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </Link>
      </div>

      {loading && (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={140} className="p-6" />
        </div>
      )}

      {!loading && error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label={t("activeEmployees")}
              value={data.summary.active_employees}
              icon={<Wallet size={20} />}
              color="text-card-blue"
              bgColor="bg-card-blue-light"
            />
            <KpiCard
              label={t("monthlyPayroll")}
              value={`USD ${data.summary.monthly_payroll.toFixed(2)}`}
              icon={<DollarSign size={20} />}
              color="text-card-orange"
              bgColor="bg-card-orange-light"
            />
            <KpiCard
              label={t("totalIncome")}
              value={`USD ${data.summary.total_income.toFixed(2)}`}
              icon={<DollarSign size={20} />}
              color="text-card-green"
              bgColor="bg-card-green-light"
            />
            <KpiCard
              label={t("netEarning")}
              value={`USD ${data.summary.net_earning.toFixed(2)}`}
              icon={<BarChart3 size={20} />}
              color={data.summary.net_earning >= 0 ? "text-card-green" : "text-card-red"}
              bgColor={data.summary.net_earning >= 0 ? "bg-card-green-light" : "bg-card-red-light"}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <MoneyBarChart
              title={t("incomeTrend")}
              data={incomeTrend}
              color="bg-gradient-to-t from-card-green to-primary"
            />
            <MoneyBarChart
              title={t("payrollTrend")}
              data={payrollTrend}
              color="bg-gradient-to-t from-card-orange to-card-red"
            />
            <MoneyBarChart
              title={t("netEarningTrend")}
              data={netTrend}
              color="bg-gradient-to-t from-card-blue to-card-green"
            />
          </div>

          <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="text-sm font-semibold text-text-primary">{t("employeeSalaries")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-background">
                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("name")}</th>
                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("role")}</th>
                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("monthlySalary")}</th>
                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">{employee.full_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{t(employee.role)}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        USD {employee.salary_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {employee.is_active ? t("active") : t("inactive")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
