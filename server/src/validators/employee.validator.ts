import { z } from "zod";

const employeeRoleSchema = z.enum(["owner", "admin", "employee"]);

export const employeeAccessSchema = z.object({
    rent: z.boolean().optional(),
    electricity: z.boolean().optional(),
    expenses: z.boolean().optional(),
    employees: z.boolean().optional(),
    clients: z.boolean().optional(),
});

export const employeeQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
    role: employeeRoleSchema.optional(),
    status: z.enum(["active", "inactive"]).optional(),
});

export const createEmployeeSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    role: employeeRoleSchema.default("employee"),
    salary_amount: z.coerce.number().min(0).optional(),
    access: employeeAccessSchema.optional(),
    is_active: z.boolean().optional(),
});

export const updateEmployeeSchema = z.object({
    full_name: z.string().min(1).optional(),
    email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    role: employeeRoleSchema.optional(),
    salary_amount: z.coerce.number().min(0).optional(),
    access: employeeAccessSchema.optional(),
    is_active: z.boolean().optional(),
});

export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
