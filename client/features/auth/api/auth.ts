// ============================================================
// Keswani System — Frontend Auth API Helpers
// Usage: import { login, forgotPassword, ... } from '@/features/auth/api/auth'
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

// -------------------------------------------
// Types
// -------------------------------------------
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    details?: Record<string, string[]>;
}

interface AuthUser {
    id: string;
    email: string;
    user_type: "employee" | "client";
    profile_id: string;
    role?: string;
    access?: Record<string, boolean>;
}

interface LoginResponse {
    token: string;
    refresh_token: string;
    expires_at: number;
    user: AuthUser;
}

interface MeResponse {
    user: AuthUser;
    profile: Record<string, unknown>;
}

// -------------------------------------------
// Helper
// -------------------------------------------
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    const data: ApiResponse<T> = await res.json();

    if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
}

function authHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}

// -------------------------------------------
// Auth API Functions
// -------------------------------------------

/**
 * Login with email + password.
 * Returns token + user profile.
 * @param rememberMe - if true, tokens are stored longer (7-30 days)
 */
export async function login(
    email: string,
    password: string,
    rememberMe: boolean = false
): Promise<ApiResponse<LoginResponse>> {
    return fetchApi<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });
}

/**
 * Request a password reset email.
 * Always returns success (prevents email enumeration).
 */
export async function forgotPassword(
    email: string
): Promise<ApiResponse> {
    return fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

/**
 * Reset password using the token from the reset email.
 */
export async function resetPassword(
    accessToken: string,
    newPassword: string
): Promise<ApiResponse> {
    return fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            access_token: accessToken,
            new_password: newPassword,
        }),
    });
}

/**
 * Change password for an authenticated user.
 * Expects `token` (access token) to be provided and current/new passwords.
 */
export async function changePassword(
    token: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<ApiResponse> {
    return fetchApi("/auth/change-password", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        }),
    });
}

/**
 * Get the current authenticated user's profile.
 */
export async function getMe(
    token: string
): Promise<ApiResponse<MeResponse>> {
    return fetchApi<MeResponse>("/auth/me", {
        method: "GET",
        headers: authHeaders(token),
    });
}

/**
 * Logout (invalidates server session).
 */
export async function logout(token: string): Promise<ApiResponse> {
    return fetchApi("/auth/logout", {
        method: "POST",
        headers: authHeaders(token),
    });
}

/**
 * Refresh the session using a refresh token.
 */
export async function refreshToken(
    refreshTokenStr: string
): Promise<ApiResponse<{ token: string; refresh_token: string; expires_at: number }>> {
    return fetchApi("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshTokenStr }),
    });
}
