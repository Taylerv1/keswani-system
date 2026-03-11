import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

/**
 * Require the user to be an employee with one of the specified roles.
 * Usage: requireRole('owner', 'admin')
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        if (req.user.user_type !== "employee") {
            res.status(403).json({
                success: false,
                error: "This endpoint is only accessible to employees",
            });
            return;
        }

        if (!req.user.role || !allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Requires one of these roles: ${allowedRoles.join(", ")}`,
            });
            return;
        }

        next();
    };
};

/**
 * Require the employee to have a specific access permission.
 * Checks the `access` JSONB field. Owner and admin bypass this check.
 * Usage: requireAccess('rent'), requireAccess('electricity')
 */
export const requireAccess = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        if (req.user.user_type !== "employee") {
            res.status(403).json({
                success: false,
                error: "This endpoint is only accessible to employees",
            });
            return;
        }

        // Owner and admin bypass access checks
        if (req.user.role === "owner" || req.user.role === "admin") {
            return next();
        }

        // Check fine-grained access
        if (!req.user.access || !req.user.access[permission]) {
            res.status(403).json({
                success: false,
                error: `You do not have '${permission}' access. Contact your administrator.`,
            });
            return;
        }

        next();
    };
};

/**
 * Require the employee to have at least one of the specified access permissions.
 * Owner/admin bypass checks.
 * Usage: requireAnyAccess("rent", "electricity")
 */
export const requireAnyAccess = (...permissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        if (req.user.user_type !== "employee") {
            res.status(403).json({
                success: false,
                error: "This endpoint is only accessible to employees",
            });
            return;
        }

        if (req.user.role === "owner" || req.user.role === "admin") {
            return next();
        }

        const hasAnyPermission = permissions.some(
            (permission) => Boolean(req.user?.access?.[permission])
        );

        if (!hasAnyPermission) {
            res.status(403).json({
                success: false,
                error: `You need one of these permissions: ${permissions.join(", ")}`,
            });
            return;
        }

        next();
    };
};

/**
 * Require either a client user, or an employee with the specified access permission.
 * Owner/admin bypass checks.
 */
export const requireAccessOrClient = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        // Allow clients to use the endpoint
        if (req.user.user_type === "client") {
            return next();
        }

        // Otherwise must be an employee and have access
        if (req.user.user_type !== "employee") {
            res.status(403).json({ success: false, error: "This endpoint is only accessible to employees or clients" });
            return;
        }

        if (req.user.role === "owner" || req.user.role === "admin") {
            return next();
        }

        if (!req.user.access || !req.user.access[permission]) {
            res.status(403).json({ success: false, error: `You do not have '${permission}' access. Contact your administrator.` });
            return;
        }

        next();
    };
};

/**
 * Require the user to be a client (tenant/subscriber).
 */
export const requireClient = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated" });
        return;
    }

    if (req.user.user_type !== "client") {
        res.status(403).json({
            success: false,
            error: "This endpoint is only accessible to clients",
        });
        return;
    }

    next();
};
