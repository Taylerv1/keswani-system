import { Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import prisma from "../config/prisma";
import { AuthenticatedRequest, AuthUser } from "../types";

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
        const employee = await prisma.employees.findFirst({
            where: {
                auth_user_id: supabaseUser.id,
                deleted_at: null,
            },
        });

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
        const client = await prisma.clients.findFirst({
            where: {
                auth_user_id: supabaseUser.id,
                deleted_at: null,
            },
        });

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
