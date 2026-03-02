// ============================================================
// Profile Module — Types
// ============================================================

export interface EmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  role: "owner" | "admin" | "employee";
  access: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  created_at: string;
  last_login: string | null;
}

export type UserProfile = EmployeeProfile | ClientProfile;

export interface AuthUser {
  id: string;
  email: string;
  user_type: "employee" | "client";
  profile_id: string;
  role?: string;
  access?: Record<string, boolean>;
}

export interface GetProfileResponse {
  user: AuthUser;
  profile: UserProfile;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  address?: string;
}

export interface UpdateProfileResponse {
  user: AuthUser;
  profile: UserProfile;
}
