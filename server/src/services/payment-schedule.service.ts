import prisma from "../config/prisma";
import type { contracts, rent_payments } from "@prisma/client";

type ContractSnapshot = Pick<
  contracts,
  "id" | "status" | "start_date" | "end_date" | "monthly_rent" | "currency" | "deleted_at"
>;

type PaymentScheduleSeed = Pick<
  rent_payments,
  "period_start" | "period_end" | "payment_date"
>;

const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

function toDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * MILLIS_IN_DAY);
}

function addMonths(value: Date, months: number): Date {
  const next = new Date(value.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return toDateOnly(next);
}

function firstDayOfMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function lastDayOfMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
}

function getTodayDateOnly(): Date {
  return toDateOnly(new Date());
}

function getScheduleStatusByDueDate(dueDate: Date): "pending" | "overdue" {
  return dueDate < getTodayDateOnly() ? "overdue" : "pending";
}

function buildInitialPeriod(contract: ContractSnapshot): {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
} | null {
  const periodStart = toDateOnly(contract.start_date);
  let periodEnd = addDays(addMonths(periodStart, 1), -1);

  if (contract.end_date) {
    const contractEnd = toDateOnly(contract.end_date);
    if (contractEnd < periodStart) return null;
    if (contractEnd < periodEnd) periodEnd = contractEnd;
  }

  return { periodStart, periodEnd, dueDate: periodEnd };
}

function resolveCurrentPeriod(seed: PaymentScheduleSeed): {
  periodStart: Date;
  periodEnd: Date;
} | null {
  if (seed.period_start && seed.period_end) {
    return {
      periodStart: toDateOnly(seed.period_start),
      periodEnd: toDateOnly(seed.period_end),
    };
  }

  if (seed.period_start && !seed.period_end) {
    const start = toDateOnly(seed.period_start);
    return {
      periodStart: start,
      periodEnd: addDays(addMonths(start, 1), -1),
    };
  }

  if (!seed.period_start && seed.period_end) {
    const end = toDateOnly(seed.period_end);
    return {
      periodStart: firstDayOfMonth(end),
      periodEnd: end,
    };
  }

  const paymentDate = toDateOnly(seed.payment_date);
  return {
    periodStart: firstDayOfMonth(paymentDate),
    periodEnd: lastDayOfMonth(paymentDate),
  };
}

function buildNextPeriod(
  current: { periodStart: Date; periodEnd: Date },
  contractEndDate: Date | null
): { periodStart: Date; periodEnd: Date; dueDate: Date } | null {
  const nextStart = addMonths(current.periodStart, 1);

  if (contractEndDate && nextStart > contractEndDate) {
    return null;
  }

  let nextEnd = addMonths(current.periodEnd, 1);

  if (contractEndDate && nextEnd > contractEndDate) {
    nextEnd = contractEndDate;
  }

  if (nextEnd < nextStart) return null;

  return {
    periodStart: nextStart,
    periodEnd: nextEnd,
    dueDate: nextEnd,
  };
}

export async function markOverdueRentPayments(): Promise<void> {
  await prisma.rent_payments.updateMany({
    where: {
      deleted_at: null,
      status: "pending",
      payment_date: { lt: getTodayDateOnly() },
    },
    data: { status: "overdue" },
  });
}

export async function ensureInitialInstallmentForContract(
  contract: ContractSnapshot
): Promise<void> {
  if (contract.deleted_at !== null || contract.status !== "active") return;

  const existingPayment = await prisma.rent_payments.findFirst({
    where: {
      contract_id: contract.id,
      deleted_at: null,
    },
    select: { id: true },
  });
  if (existingPayment) return;

  const initialPeriod = buildInitialPeriod(contract);
  if (!initialPeriod) return;

  await prisma.rent_payments.create({
    data: {
      contract_id: contract.id,
      amount: contract.monthly_rent,
      currency: contract.currency,
      payment_date: initialPeriod.dueDate,
      period_start: initialPeriod.periodStart,
      period_end: initialPeriod.periodEnd,
      payment_method: "cash",
      status: getScheduleStatusByDueDate(initialPeriod.dueDate),
      received_by: null,
      receipt_number: null,
      notes: null,
    },
  });
}

export async function ensurePaymentSchedulesForActiveContracts(): Promise<void> {
  const activeContracts = await prisma.contracts.findMany({
    where: {
      status: "active",
      deleted_at: null,
    },
    select: {
      id: true,
      status: true,
      start_date: true,
      end_date: true,
      monthly_rent: true,
      currency: true,
      deleted_at: true,
    },
  });

  if (activeContracts.length === 0) return;

  const existing = await prisma.rent_payments.findMany({
    where: {
      deleted_at: null,
      contract_id: {
        in: activeContracts.map((contract) => contract.id),
      },
    },
    select: { contract_id: true },
    distinct: ["contract_id"],
  });

  const existingContractIds = new Set(existing.map((item) => item.contract_id));
  const missingContracts = activeContracts.filter(
    (contract) => !existingContractIds.has(contract.id)
  );

  if (missingContracts.length === 0) return;

  const data = missingContracts
    .map((contract) => {
      const initialPeriod = buildInitialPeriod(contract);
      if (!initialPeriod) return null;

      return {
        contract_id: contract.id,
        amount: contract.monthly_rent,
        currency: contract.currency,
        payment_date: initialPeriod.dueDate,
        period_start: initialPeriod.periodStart,
        period_end: initialPeriod.periodEnd,
        payment_method: "cash" as const,
        status: getScheduleStatusByDueDate(initialPeriod.dueDate),
        received_by: null,
        receipt_number: null,
        notes: null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (data.length === 0) return;

  await prisma.rent_payments.createMany({ data });
}

export async function createNextInstallmentIfNeeded(
  contractId: string,
  sourcePayment: PaymentScheduleSeed
): Promise<void> {
  const contract = await prisma.contracts.findFirst({
    where: {
      id: contractId,
      status: "active",
      deleted_at: null,
    },
    select: {
      id: true,
      status: true,
      start_date: true,
      end_date: true,
      monthly_rent: true,
      currency: true,
      deleted_at: true,
    },
  });

  if (!contract) return;

  const currentPeriod = resolveCurrentPeriod(sourcePayment);
  if (!currentPeriod) return;

  const contractEnd = contract.end_date ? toDateOnly(contract.end_date) : null;
  const nextPeriod = buildNextPeriod(currentPeriod, contractEnd);
  if (!nextPeriod) return;

  const existingNext = await prisma.rent_payments.findFirst({
    where: {
      contract_id: contract.id,
      deleted_at: null,
      period_start: nextPeriod.periodStart,
      period_end: nextPeriod.periodEnd,
    },
    select: { id: true },
  });
  if (existingNext) return;

  await prisma.rent_payments.create({
    data: {
      contract_id: contract.id,
      amount: contract.monthly_rent,
      currency: contract.currency,
      payment_date: nextPeriod.dueDate,
      period_start: nextPeriod.periodStart,
      period_end: nextPeriod.periodEnd,
      payment_method: "cash",
      status: getScheduleStatusByDueDate(nextPeriod.dueDate),
      received_by: null,
      receipt_number: null,
      notes: null,
    },
  });
}
