// ============================================================
// Client-Side Auth Utilities
// Usage: import { getUserData, isAuthenticated, logout } from '@/lib/auth-client'
// ============================================================

interface UserData {
    id: string;
    email: string;
    user_type: "employee" | "client";
    profile_id: string;
    role?: string;
    access?: Record<string, boolean>;
}

interface BasicApiResponse {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Get user data from cookies (client-side accessible)
 */
export function getUserData(): UserData | null {
    if (typeof window === "undefined") return null;

    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_data="))
        ?.split("=")[1];

    if (!cookieValue) return null;

    try {
        return JSON.parse(decodeURIComponent(cookieValue));
    } catch {
        return null;
    }
}

/**
 * Check if user is authenticated (has user_data cookie)
 */
export function isAuthenticated(): boolean {
    return getUserData() !== null;
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
    const user = getUserData();
    return user?.role === role;
}

/**
 * Check if user has access to a specific module
 */
export function hasAccess(module: string): boolean {
    const user = getUserData();
    if (!user?.access) return false;
    return user.access[module] === true;
}

/**
 * Best-effort removal of client-readable auth cookies
 */
function clearClientAuthCookies() {
    if (typeof document === "undefined") return;

    document.cookie = "user_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

/**
 * Logout - clears client auth state immediately and clears server cookies in background.
 * Navigation should be handled by the caller (e.g. router.replace('/login')).
 */
export function logout() {
    clearClientAuthCookies();

    void fetch("/api/auth/logout", {
        method: "POST",
        keepalive: true,
    }).catch((error) => {
        console.error("Background logout error:", error);
    });
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<boolean> {
    try {
        const response = await fetch("/api/auth/refresh", {
            method: "POST",
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error("Token refresh error:", error);
        return false;
    }
}

/**
 * Change password for the currently authenticated user.
 * Uses Next.js proxy route so httpOnly auth cookie is used securely.
 */
export async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<BasicApiResponse> {
    try {
        const response = await fetch("/api/auth/change-password", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            }),
        });

        const result = (await response.json()) as BasicApiResponse;
        if (!response.ok) {
            return {
                success: false,
                error: result.error || "Failed to change password",
            };
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to change password",
        };
    }
}
