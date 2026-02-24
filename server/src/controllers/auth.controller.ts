import { Response, NextFunction } from "express";
import { supabase, supabaseAdmin } from "../config/supabase";
import prisma from "../config/prisma";
import {
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    changePasswordSchema,
} from "../validators/auth.validator";
import { AuthenticatedRequest, ApiResponse, LoginResponse } from "../types";

/**
 * POST /api/auth/login
 * Sign in with email + password. Returns JWT + user profile.
 */
export const login = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Validate request body
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            } as ApiResponse);
            return;
        }

        const { email, password, remember_me } = parsed.data;

        // Sign in with Supabase Auth
        const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({ email, password });

        if (authError || !authData.session) {
            res.status(401).json({
                success: false,
                error: authError?.message || "Invalid email or password",
            } as ApiResponse);
            return;
        }

        const authUserId = authData.user.id;

        // Look up in employees table first
        const employee = await prisma.employees.findFirst({
            where: {
                auth_user_id: authUserId,
                deleted_at: null,
            },
        });

        if (employee) {
            if (!employee.is_active) {
                res.status(403).json({
                    success: false,
                    error: "Your account has been deactivated. Contact an administrator.",
                } as ApiResponse);
                return;
            }

            const access =
                typeof employee.access === "object" && employee.access !== null
                    ? (employee.access as Record<string, boolean>)
                    : {};

            const response: ApiResponse<LoginResponse> = {
                success: true,
                data: {
                    token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                    expires_at: authData.session.expires_at || 0,
                    user: {
                        id: authUserId,
                        email: employee.email || email,
                        user_type: "employee",
                        profile_id: employee.id,
                        role: employee.role,
                        access,
                    },
                },
            };

            res.json(response);
            return;
        }

        // Look up in clients table
        const client = await prisma.clients.findFirst({
            where: {
                auth_user_id: authUserId,
                deleted_at: null,
            },
        });

        if (client) {
            const response: ApiResponse<LoginResponse> = {
                success: true,
                data: {
                    token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                    expires_at: authData.session.expires_at || 0,
                    user: {
                        id: authUserId,
                        email: client.email || email,
                        user_type: "client",
                        profile_id: client.id,
                    },
                },
            };

            res.json(response);
            return;
        }

        // Exists in auth but not in our database
        res.status(403).json({
            success: false,
            error: "Account not found in system. Contact an administrator.",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email via Supabase.
 */
export const forgotPassword = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            } as ApiResponse);
            return;
        }

        const { email } = parsed.data;
        const redirectTo = `${process.env.FRONTEND_URL}/reset-password`;

        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (error) {
            // Don't reveal if email exists or not — always return success
            console.error("Password reset error:", error.message);
        }

        // Always return success to prevent email enumeration
        res.json({
            success: true,
            message: "If the email exists, a password reset link has been sent.",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/reset-password
 * Updates password using the access token from the reset email link.
 */
export const resetPassword = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            } as ApiResponse);
            return;
        }

        const { access_token, new_password } = parsed.data;

        // Verify the token first
        const {
            data: { user },
            error: verifyError,
        } = await supabaseAdmin.auth.getUser(access_token);

        if (verifyError || !user) {
            res.status(401).json({
                success: false,
                error: "Invalid or expired reset token",
            } as ApiResponse);
            return;
        }

        // Update the password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: new_password }
        );

        if (updateError) {
            res.status(500).json({
                success: false,
                error: "Failed to update password. Please try again.",
            } as ApiResponse);
            return;
        }

        res.json({
            success: true,
            message: "Password has been reset successfully.",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
export const getMe = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        // Fetch Supabase user details (admin) to get last sign-in
        let lastLogin: string | null = null;
        try {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
            if (userData && (userData.user as any)?.last_sign_in_at) {
                lastLogin = (userData.user as any).last_sign_in_at as string;
            }
        } catch (e) {
            // ignore errors — lastLogin will remain null
            console.error("Failed to fetch supabase user for last login:", e);
        }

        let profile: Record<string, unknown> = {};

        if (req.user.user_type === "employee") {
            const emp = await prisma.employees.findUnique({
                where: { id: req.user.profile_id },
            });
            if (emp) {
                profile = {
                    id: emp.id,
                    full_name: emp.full_name,
                    email: emp.email,
                    phone: emp.phone,
                    role: emp.role,
                    access: emp.access,
                    address: (emp as any).address || null,
                    last_login: lastLogin,
                    is_active: emp.is_active,
                    created_at: emp.created_at,
                };
            }
        } else {
            const cli = await prisma.clients.findUnique({
                where: { id: req.user.profile_id },
            });
            if (cli) {
                profile = {
                    id: cli.id,
                    full_name: cli.full_name,
                    email: cli.email,
                    phone: cli.phone,
                    address: cli.address || null,
                    last_login: lastLogin,
                    created_at: cli.created_at,
                };
            }
        }

        res.json({
            success: true,
            data: {
                user: req.user,
                profile,
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/auth/profile
 * Update current user's profile (name, phone, address)
 */
export const updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors } as ApiResponse);
            return;
        }

        const { full_name, phone, address } = parsed.data;

        if (req.user.user_type === "employee") {
            const data: any = {};
            if (full_name !== undefined) data.full_name = full_name;
            if (phone !== undefined) data.phone = phone;
            // address may not exist on employees table — only update if column exists
            const cols: any = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='employees' AND column_name='address'`;
            if (Array.isArray(cols) && cols.length > 0) {
                if (address !== undefined) data.address = address;
            }

            const updated = await prisma.employees.update({ where: { id: req.user.profile_id }, data });

            res.json({ success: true, data: { profile: { id: updated.id, full_name: updated.full_name, email: updated.email, phone: updated.phone, address: (updated as any).address || null } } } as ApiResponse);
            return;
        }

        // client
        if (req.user.user_type === "client") {
            const data: any = {};
            if (full_name !== undefined) data.full_name = full_name;
            if (phone !== undefined) data.phone = phone;
            if (address !== undefined) data.address = address;

            const updated = await prisma.clients.update({ where: { id: req.user.profile_id }, data });

            res.json({ success: true, data: { profile: { id: updated.id, full_name: updated.full_name, email: updated.email, phone: updated.phone, address: updated.address } } } as ApiResponse);
            return;
        }

        res.status(400).json({ success: false, error: "Unsupported user type" });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/logout
 * Signs out the user (invalidates the Supabase session).
 */
export const logout = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            // Sign out on Supabase side
            await supabaseAdmin.auth.admin.signOut(token);
        }

        res.json({
            success: true,
            message: "Logged out successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/refresh
 * Refreshes the session using a refresh token.
 */
export const refreshToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            res.status(400).json({
                success: false,
                error: "Refresh token is required",
            } as ApiResponse);
            return;
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token,
        });

        if (error || !data.session) {
            res.status(401).json({
                success: false,
                error: "Invalid or expired refresh token",
            } as ApiResponse);
            return;
        }

        res.json({
            success: true,
            data: {
                token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/auth/change-password
 * Change password for authenticated user.
 * Verifies current password and updates to new password.
 */
export const changePassword = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }

        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            } as ApiResponse);
            return;
        }

        const { current_password, new_password } = parsed.data;

        // Get user's email to verify current password
        let userEmail: string | undefined;
        if (req.user.user_type === "employee") {
            const emp = await prisma.employees.findUnique({
                where: { id: req.user.profile_id },
            });
            userEmail = emp?.email;
        } else {
            const client = await prisma.clients.findUnique({
                where: { id: req.user.profile_id },
            });
            userEmail = client?.email;
        }

        if (!userEmail) {
            res.status(500).json({
                success: false,
                error: "User email not found in system",
            } as ApiResponse);
            return;
        }

        // Verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: current_password,
        });

        if (signInError) {
            res.status(401).json({
                success: false,
                error: "Current password is incorrect",
            } as ApiResponse);
            return;
        }

        // Update password using admin API with the authenticated user's ID
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            req.user.id,
            { password: new_password }
        );

        if (updateError) {
            res.status(500).json({
                success: false,
                error: "Failed to update password. Please try again.",
            } as ApiResponse);
            return;
        }

        res.json({
            success: true,
            message: "Password changed successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
