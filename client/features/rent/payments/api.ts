import type {
  ApiResponse,
  PaymentListData,
  PaymentQueryParams,
  RentPaymentItem,
  UpdatePaymentInput,
} from "./types";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export async function getPayments(
  params?: PaymentQueryParams
): Promise<ApiResponse<PaymentListData>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.view) query.set("view", params.view);

  const queryString = query.toString();

  return fetchApi(`/api/payments${queryString ? `?${queryString}` : ""}`);
}

export async function updatePayment(
  id: string,
  payload: UpdatePaymentInput
): Promise<ApiResponse<RentPaymentItem>> {
  return fetchApi(`/api/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
