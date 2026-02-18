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
 * Logout - calls API route to clear cookies
 */
export async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
        });
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/login";
    }
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
