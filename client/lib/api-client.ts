const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const USE_MOCKS = !API_BASE;

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (USE_MOCKS) {
    const mockModule = await import(`@/mocks${endpoint}`).catch(() => null);
    if (mockModule?.default) {
      return mockModule.default as T;
    }
    throw new Error(`No mock found for ${endpoint}`);
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

export default api;
