import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import {
    createEmployeeSchema,
    employeeQuerySchema,
    updateEmployeeSchema,
} from "../validators/employee.validator";

type EmployeeRole = "owner" | "admin" | "employee";
type EmployeeAccess = {
    rent: boolean;
    electricity: boolean;
    expenses: boolean;
    employees: boolean;
    clients: boolean;
};

const ACCESS_KEYS: Array<keyof EmployeeAccess> = [
    "rent",
    "electricity",
    "expenses",
    "employees",
    "clients",
];

const EMPTY_ACCESS: EmployeeAccess = {
    rent: false,
    electricity: false,
    expenses: false,
    employees: false,
    clients: false,
};

const FULL_ACCESS: EmployeeAccess = {
    rent: true,
    electricity: true,
    expenses: true,
    employees: true,
    clients: true,
};

const START_MONTH_COUNT = 6;

const normalizeOptionalString = (
    value: string | null | undefined
): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const toNumber = (value: unknown): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const toMonth = (value: Date): string => value.toISOString().slice(0, 7);

const parseMonthStart = (month: string): Date => new Date(`${month}-01T00:00:00.000Z`);

const incrementMonth = (value: Date): Date => {
    const next = new Date(value);
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
};

const shiftMonth = (value: Date, offset: number): Date => {
    const shifted = new Date(value);
    shifted.setUTCMonth(shifted.getUTCMonth() + offset);
    return shifted;
};

const listMonths = (fromMonth: string, toMonthValue: string): string[] => {
    const result: string[] = [];
    let cursor = parseMonthStart(fromMonth);
    const end = parseMonthStart(toMonthValue);

    while (cursor <= end) {
        result.push(toMonth(cursor));
        cursor = incrementMonth(cursor);
    }

    return result;
};

const normalizeStoredAccess = (value: unknown): EmployeeAccess => {
    const normalized: EmployeeAccess = { ...EMPTY_ACCESS };
    if (!isObject(value)) return normalized;

    for (const key of ACCESS_KEYS) {
        if (typeof value[key] === "boolean") {
            normalized[key] = value[key] as boolean;
        }
    }

    return normalized;
};

const readLegacySalaryAmount = (value: unknown): number => {
    if (!isObject(value)) return 0;
    const salary = toNumber(value.salary_amount);
    return salary >= 0 ? salary : 0;
};

const buildCreateAccess = (
    role: EmployeeRole,
    value: unknown
): EmployeeAccess => {
    const base = role === "owner" || role === "admin" ? { ...FULL_ACCESS } : { ...EMPTY_ACCESS };
    if (!isObject(value)) return base;

    for (const key of ACCESS_KEYS) {
        if (typeof value[key] === "boolean") {
            base[key] = value[key] as boolean;
        }
    }

    return base;
};

const mapEmployee = (employee: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    role: EmployeeRole;
    access: unknown;
    salary_amount: unknown;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}) => ({
    id: employee.id,
    full_name: employee.full_name,
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    address: employee.address ?? "",
    role: employee.role,
    access: normalizeStoredAccess(employee.access),
    salary_amount: Number(
        toNumber(employee.salary_amount ?? readLegacySalaryAmount(employee.access)).toFixed(2)
    ),
    is_active: employee.is_active,
    created_at: employee.created_at,
    updated_at: employee.updated_at,
});

/**
 * GET /api/employees
 * List employees with search + pagination.
 */
export const getEmployees = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = employeeQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, role, status } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.employeesWhereInput = {
            deleted_at: null,
        };

        if (role) {
            where.role = role;
        }

        if (status === "active") {
            where.is_active = true;
        } else if (status === "inactive") {
            where.is_active = false;
        }

        if (search) {
            where.OR = [
                {
                    full_name: {
                        contains: search,
                        mode: "insensitive" as Prisma.QueryMode,
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive" as Prisma.QueryMode,
                    },
                },
                {
                    phone: {
                        contains: search,
                        mode: "insensitive" as Prisma.QueryMode,
                    },
                },
            ];
        }

        const [employees, total] = await Promise.all([
            prisma.employees.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                    address: true,
                    role: true,
                    access: true,
                    salary_amount: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                },
            }),
            prisma.employees.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                items: employees.map(mapEmployee),
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/employees/:id
 * Get employee details by id.
 */
export const getEmployeeById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const employee = await prisma.employees.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                access: true,
                salary_amount: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!employee) {
            res.status(404).json({ success: false, error: "Employee not found" });
            return;
        }

        res.json({
            success: true,
            data: mapEmployee(employee),
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/employees/lookup
 * Lightweight employee lookup list.
 */
export const getEmployeesLookup = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        const where: Prisma.employeesWhereInput = { deleted_at: null };

        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { email: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ];
        }

        const employees = await prisma.employees.findMany({
            where,
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                role: true,
            },
            orderBy: { full_name: "asc" },
            take: 100,
        });

        res.json({
            success: true,
            data: employees.map((employee) => ({
                id: employee.id,
                full_name: employee.full_name,
                email: employee.email ?? "",
                phone: employee.phone ?? "",
                role: employee.role,
            })),
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/employees
 * Create employee.
 */
export const createEmployee = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const fullName = parsed.data.full_name.trim();
        const email = normalizeOptionalString(parsed.data.email)?.toLowerCase() ?? null;
        const phone = normalizeOptionalString(parsed.data.phone) ?? null;
        const address = normalizeOptionalString(parsed.data.address) ?? null;
        const role = parsed.data.role as EmployeeRole;
        const access = buildCreateAccess(role, parsed.data.access);
        const salaryAmount = parsed.data.salary_amount ?? 0;
        const isActive = parsed.data.is_active ?? true;

        if (email) {
            const existingByEmail = await prisma.employees.findFirst({
                where: {
                    email: { equals: email, mode: "insensitive" as Prisma.QueryMode },
                },
                select: {
                    id: true,
                    deleted_at: true,
                },
            });

            if (existingByEmail?.deleted_at) {
                res.status(409).json({
                    success: false,
                    error:
                        "An employee with this email already exists in archived records. Update that employee instead of creating a new one.",
                });
                return;
            }

            if (existingByEmail) {
                res.status(409).json({
                    success: false,
                    error: "An employee with this email already exists",
                });
                return;
            }
        }

        const created = await prisma.employees.create({
            data: {
                full_name: fullName,
                email,
                phone,
                address,
                role,
                access,
                salary_amount: Number(salaryAmount.toFixed(2)),
                is_active: isActive,
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                access: true,
                salary_amount: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });

        res.status(201).json({
            success: true,
            data: mapEmployee(created),
            message: "Employee created successfully",
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/employees/:id
 * Update employee.
 */
export const updateEmployee = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.employees.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                access: true,
                salary_amount: true,
            },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: "Employee not found" });
            return;
        }

        const parsed = updateEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const nextEmail = normalizeOptionalString(parsed.data.email)?.toLowerCase() ?? null;
        if (parsed.data.email !== undefined && nextEmail) {
            const duplicate = await prisma.employees.findFirst({
                where: {
                    id: { not: id },
                    email: { equals: nextEmail, mode: "insensitive" as Prisma.QueryMode },
                },
                select: { id: true, deleted_at: true },
            });

            if (duplicate?.deleted_at) {
                res.status(409).json({
                    success: false,
                    error:
                        "This email is already used by an archived employee record and cannot be reused.",
                });
                return;
            }

            if (duplicate) {
                res.status(409).json({
                    success: false,
                    error: "An employee with this email already exists",
                });
                return;
            }
        }

        const data: Prisma.employeesUpdateInput = {};

        if (parsed.data.full_name !== undefined) {
            data.full_name = parsed.data.full_name.trim();
        }

        if (parsed.data.email !== undefined) {
            data.email = nextEmail;
        }

        if (parsed.data.phone !== undefined) {
            data.phone = normalizeOptionalString(parsed.data.phone) ?? null;
        }

        if (parsed.data.address !== undefined) {
            data.address = normalizeOptionalString(parsed.data.address) ?? null;
        }

        if (parsed.data.role !== undefined) {
            data.role = parsed.data.role;
        }

        if (parsed.data.is_active !== undefined) {
            data.is_active = parsed.data.is_active;
        }

        if (parsed.data.access !== undefined) {
            const mergedAccess = normalizeStoredAccess(existing.access);
            for (const key of ACCESS_KEYS) {
                const incomingValue = parsed.data.access[key];
                if (typeof incomingValue === "boolean") {
                    mergedAccess[key] = incomingValue;
                }
            }
            data.access = mergedAccess;
        }

        if (parsed.data.salary_amount !== undefined) {
            data.salary_amount = Number(parsed.data.salary_amount.toFixed(2));
        }

        const updated = await prisma.employees.update({
            where: { id },
            data,
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                access: true,
                salary_amount: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });

        res.json({
            success: true,
            data: mapEmployee(updated),
            message: "Employee updated successfully",
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/employees/salary-overview
 * Salary + earnings overview for owner/admin.
 */
export const getEmployeeSalaryOverview = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const now = new Date();
        const currentMonth = toMonth(now);
        const startMonth = toMonth(shiftMonth(parseMonthStart(currentMonth), -(START_MONTH_COUNT - 1)));
        const months = listMonths(startMonth, currentMonth);
        const startDate = parseMonthStart(startMonth);
        const endDateExclusive = incrementMonth(parseMonthStart(currentMonth));

        const [employees, rentPayments, electricityPayments] = await Promise.all([
            prisma.employees.findMany({
                where: {
                    deleted_at: null,
                },
                select: {
                    id: true,
                    full_name: true,
                    role: true,
                    access: true,
                    salary_amount: true,
                    is_active: true,
                },
                orderBy: [{ role: "asc" }, { full_name: "asc" }],
            }),
            prisma.rent_payments.findMany({
                where: {
                    deleted_at: null,
                    status: "paid",
                    payment_date: {
                        gte: startDate,
                        lt: endDateExclusive,
                    },
                },
                select: {
                    amount: true,
                    payment_date: true,
                },
            }),
            prisma.bill_payments.findMany({
                where: {
                    deleted_at: null,
                    status: { in: ["paid", "partial"] },
                    payment_date: {
                        gte: startDate,
                        lt: endDateExclusive,
                    },
                },
                select: {
                    amount: true,
                    payment_date: true,
                },
            }),
        ]);

        const payrollEmployees = employees
            .filter((employee) => employee.is_active)
            .map((employee) => {
                const salaryAmount = Number(
                    toNumber(employee.salary_amount ?? readLegacySalaryAmount(employee.access)).toFixed(2)
                );
                return {
                    id: employee.id,
                    full_name: employee.full_name,
                    role: employee.role,
                    is_active: employee.is_active,
                    salary_amount: salaryAmount,
                };
            })
            .sort((a, b) => b.salary_amount - a.salary_amount);

        const monthlyPayroll = payrollEmployees.reduce(
            (sum, employee) => sum + employee.salary_amount,
            0
        );

        const rentByMonth = new Map<string, number>();
        const electricityByMonth = new Map<string, number>();
        for (const month of months) {
            rentByMonth.set(month, 0);
            electricityByMonth.set(month, 0);
        }

        for (const payment of rentPayments) {
            const month = toMonth(payment.payment_date);
            if (!rentByMonth.has(month)) continue;
            rentByMonth.set(month, (rentByMonth.get(month) ?? 0) + toNumber(payment.amount));
        }

        for (const payment of electricityPayments) {
            const month = toMonth(payment.payment_date);
            if (!electricityByMonth.has(month)) continue;
            electricityByMonth.set(
                month,
                (electricityByMonth.get(month) ?? 0) + toNumber(payment.amount)
            );
        }

        const monthly = months.map((month) => {
            const rentIncome = rentByMonth.get(month) ?? 0;
            const electricityIncome = electricityByMonth.get(month) ?? 0;
            const totalIncome = rentIncome + electricityIncome;
            const payrollCost = monthlyPayroll;
            const netEarning = totalIncome - payrollCost;

            return {
                month,
                rent_income: Number(rentIncome.toFixed(2)),
                electricity_income: Number(electricityIncome.toFixed(2)),
                total_income: Number(totalIncome.toFixed(2)),
                payroll_cost: Number(payrollCost.toFixed(2)),
                net_earning: Number(netEarning.toFixed(2)),
            };
        });

        const totalIncome = monthly.reduce((sum, item) => sum + item.total_income, 0);
        const totalPayroll = monthly.reduce((sum, item) => sum + item.payroll_cost, 0);
        const totalNet = monthly.reduce((sum, item) => sum + item.net_earning, 0);

        res.json({
            success: true,
            data: {
                range: {
                    from_month: startMonth,
                    to_month: currentMonth,
                },
                summary: {
                    active_employees: payrollEmployees.length,
                    monthly_payroll: Number(monthlyPayroll.toFixed(2)),
                    total_income: Number(totalIncome.toFixed(2)),
                    total_payroll: Number(totalPayroll.toFixed(2)),
                    net_earning: Number(totalNet.toFixed(2)),
                },
                employees: payrollEmployees,
                monthly,
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/employees/:id
 * Soft delete employee.
 */
export const deleteEmployee = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.employees.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: {
                id: true,
                role: true,
            },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: "Employee not found" });
            return;
        }

        if (req.user?.user_type === "employee" && req.user.profile_id === id) {
            res.status(409).json({
                success: false,
                error: "You cannot delete your own employee account",
            });
            return;
        }

        if (existing.role === "owner") {
            res.status(409).json({
                success: false,
                error: "Owner account cannot be deleted",
            });
            return;
        }

        await prisma.employees.update({
            where: { id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        res.json({
            success: true,
            data: { success: true },
            message: "Employee deleted successfully",
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};
