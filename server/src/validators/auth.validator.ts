import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    remember_me: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    access_token: z.string().min(1, "Access token is required"),
    new_password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateProfileSchema = z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
