// =========================================================
// MICROFOUNDER NETWORK — AUTH TYPES
// User roles and permissions
// =========================================================

export type UserRole = "public" | "member" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  passportId?: string;
  displayName?: string;
}

export interface SessionData {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Admin emails - in production, this would be in a database
export const ADMIN_EMAILS = [
  "admin@microfounders.network",
  "kojo@metalmindtech.com",
  "kesarel@metalmindtech.com",
] as const;

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase() as typeof ADMIN_EMAILS[number]);
}
