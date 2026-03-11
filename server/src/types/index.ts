import { Request } from "express";

// -------------------------------------------
// Auth types
// -------------------------------------------
export interface AuthUser {
    id: string;             // Supabase auth user ID
    email: string;
    user_type: "employee" | "client";
    profile_id: string;     // ID in employees or clients table
    role?: string;          // employee_role (owner/admin/employee) — only for employees
    access?: Record<string, boolean>; // fine-grained permissions — only for employees
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

// -------------------------------------------
// API Response types
// -------------------------------------------
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface LoginResponse {
    token: string;
    refresh_token: string;
    expires_at: number;
    user: AuthUser;
}

export interface MeResponse {
    user: AuthUser;
    profile: Record<string, unknown>;
}
