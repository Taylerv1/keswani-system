import type {
  ApiResponse,
  ClientLookupItem,
  CreatedContractClient,
  ContractDetail,
  ContractListItem,
  ContractQueryParams,
  CreateContractClientInput,
  CreateContractInput,
  LookupBundle,
  PaginatedResponse,
  PropertyLookupItem,
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

export async function getContracts(
  params?: ContractQueryParams
): Promise<ApiResponse<PaginatedResponse<ContractListItem>>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const queryString = query.toString();

  return fetchApi(`/api/contracts${queryString ? `?${queryString}` : ""}`);
}

export async function getContractById(
  id: string
): Promise<ApiResponse<ContractDetail>> {
  return fetchApi(`/api/contracts/${id}`);
}

export async function createContract(
  payload: CreateContractInput
): Promise<ApiResponse<ContractDetail>> {
  return fetchApi("/api/contracts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createContractClient(
  payload: CreateContractClientInput
): Promise<ApiResponse<CreatedContractClient>> {
  return fetchApi("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function terminateContract(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/contracts/${id}`, {
    method: "DELETE",
  });
}

export async function getContractLookups(): Promise<
  ApiResponse<Required<Pick<LookupBundle, "properties" | "clients">>>
> {
  const response = await fetchApi<LookupBundle>(
    "/api/lookups?resources=properties,clients"
  );

  return {
    ...response,
    data: {
      properties: (response.data?.properties ?? []) as PropertyLookupItem[],
      clients: (response.data?.clients ?? []) as ClientLookupItem[],
    },
  };
}
