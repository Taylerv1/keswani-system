/**
 * API layer for Keswani System.
 * Toggles between mock data and real API based on environment.
 */

const API_BASE: string = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

/**
 * Set to true to use mock data instead of real API calls.
 * When NEXT_PUBLIC_API_BASE is not set, mocks are used automatically.
 */
export const useMocks: boolean = !process.env.NEXT_PUBLIC_API_BASE;

/**
 * Generic fetch wrapper that returns mock data when useMocks is true,
 * or fetches from the real API otherwise.
 *
 * @param endpoint - API endpoint path (e.g. "/auth/login")
 * @param options  - Standard fetch RequestInit options
 * @param mockData - Mock data to return when useMocks is true
 */
export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit,
    mockData?: T
): Promise<T> {
    if (useMocks && mockData !== undefined) {
        // Simulate network delay in development
        await new Promise((resolve) => setTimeout(resolve, 300));
        return mockData;
    }

    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}

export default API_BASE;
