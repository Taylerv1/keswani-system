export interface PricingPlan {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PricingPlanPayload {
    name: string;
    price: number;
    description: string;
    features: string[];
}

class PricingServiceError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "PricingServiceError";
        this.status = status;
    }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const raw = await response.text();
    const trimmed = raw.trim();

    if (!trimmed) {
        if (response.ok) {
            return { success: true };
        }

        throw new PricingServiceError(`Request failed with status ${response.status}`, response.status);
    }

    try {
        return JSON.parse(trimmed) as ApiResponse<T>;
    } catch {
        if (!response.ok) {
            throw new PricingServiceError(`Request failed with status ${response.status}`, response.status);
        }
        throw new PricingServiceError("Invalid JSON response from server", response.status);
    }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

    const parsed = await parseResponse<T>(response);

    if (!response.ok || !parsed.success) {
        throw new PricingServiceError(
            parsed.error || parsed.message || `Request failed with status ${response.status}`,
            response.status
        );
    }

    return parsed;
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
    const result = await request<PricingPlan[]>("/api/pricing", { method: "GET" });
    return result.data ?? [];
}

export async function createPricingPlan(payload: PricingPlanPayload): Promise<PricingPlan | null> {
    const result = await request<PricingPlan>("/api/pricing", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    return result.data ?? null;
}

export async function updatePricingPlan(id: string, payload: PricingPlanPayload): Promise<PricingPlan | null> {
    const result = await request<PricingPlan>(`/api/pricing/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });

    return result.data ?? null;
}
