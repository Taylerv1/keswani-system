import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { supabaseAdmin } from "../config/supabase";
import prisma from "../config/prisma";
import { AuthenticatedRequest, AuthUser } from "../types";

type EmployeeProfile = {
    id: string;
    email: string | null;
    role: string;
    access: unknown;
};

type ClientProfile = {
    id: string;
    email: string | null;
};

const isPrismaConnectivityError = (error: unknown): boolean => {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return true;
    }

    const message = error instanceof Error ? error.message : "";
    return message.includes("P1001") || message.includes("Can't reach database server");
};

const findEmployeeWithFallback = async (authUserId: string): Promise<EmployeeProfile | null> => {
    try {
        return await prisma.employees.findFirst({
            where: {
                auth_user_id: authUserId,
                deleted_at: null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                access: true,
            },
        });
    } catch (error) {
        if (!isPrismaConnectivityError(error)) {
            throw error;
        }

        const { data, error: supabaseError } = await supabaseAdmin
            .from("employees")
            .select("id,email,role,access")
            .eq("auth_user_id", authUserId)
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();

        if (supabaseError) {
            throw supabaseError;
        }

        return data as EmployeeProfile | null;
    }
};

const findClientWithFallback = async (authUserId: string): Promise<ClientProfile | null> => {
    try {
        return await prisma.clients.findFirst({
            where: {
                auth_user_id: authUserId,
                deleted_at: null,
            },
            select: {
                id: true,
                email: true,
            },
        });
    } catch (error) {
        if (!isPrismaConnectivityError(error)) {
            throw error;
        }

        const { data, error: supabaseError } = await supabaseAdmin
            .from("clients")
            .select("id,email")
            .eq("auth_user_id", authUserId)
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();

        if (supabaseError) {
            throw supabaseError;
        }

        return data as ClientProfile | null;
    }
};

/**
 * Auth middleware — verifies Supabase JWT and attaches user to request.
 * Looks up the user in employees table first, then clients table.
 */
export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "Missing or invalid authorization header",
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        // Verify JWT with Supabase
        const {
            data: { user: supabaseUser },
            error,
        } = await supabaseAdmin.auth.getUser(token);

        if (error || !supabaseUser) {
            res.status(401).json({
                success: false,
                error: "Invalid or expired token",
            });
            return;
        }

        // Look up in employees table first
        const employee = await findEmployeeWithFallback(supabaseUser.id);

        if (employee) {
            const access =
                typeof employee.access === "object" && employee.access !== null
                    ? (employee.access as Record<string, boolean>)
                    : {};

            req.user = {
                id: supabaseUser.id,
                email: supabaseUser.email || employee.email || "",
                user_type: "employee",
                profile_id: employee.id,
                role: employee.role,
                access,
            };
            return next();
        }

        // Look up in clients table
        const client = await findClientWithFallback(supabaseUser.id);

        if (client) {
            req.user = {
                id: supabaseUser.id,
                email: supabaseUser.email || client.email || "",
                user_type: "client",
                profile_id: client.id,
            };
            return next();
        }

        // User exists in Supabase Auth but not in our tables
        res.status(403).json({
            success: false,
            error: "User account not found in system. Contact an administrator.",
        });
    } catch (err) {
        next(err);
    }
};
