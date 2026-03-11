import {
  GetProfileResponse,
  UpdateProfileInput,
  UpdateProfileResponse,
} from "../types";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch user profile via Next.js proxy (uses httpOnly cookie)
 * Recommended: Use this for initial page load in client components
 */
export async function getProfileFromProxy(): Promise<GetProfileResponse> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  const json = (await response.json()) as ApiResponse<GetProfileResponse>;

  if (!json.success) {
    throw new Error(json.error || "Failed to fetch profile");
  }

  return json.data as GetProfileResponse;
}

/**
 * Update user profile via Next.js proxy (uses httpOnly cookie)
 * Recommended: Use this for profile updates in client components
 */
export async function updateProfileViaProxy(
  data: UpdateProfileInput
): Promise<UpdateProfileResponse> {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  const json = (await response.json()) as ApiResponse<UpdateProfileResponse>;

  if (!json.success) {
    throw new Error(json.error || "Failed to update profile");
  }

  return json.data as UpdateProfileResponse;
}

/**
 * Change user password via Next.js proxy
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      oldPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to change password: ${response.statusText}`);
  }

  const json = (await response.json()) as ApiResponse<{
    success: boolean;
    message: string;
  }>;

  if (!json.success) {
    throw new Error(json.error || "Failed to change password");
  }

  return json.data as { success: boolean; message: string };
}
