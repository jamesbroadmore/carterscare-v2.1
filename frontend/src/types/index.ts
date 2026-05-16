/**
 * Shared type definitions for the application
 */

export type AppRole = "admin" | "moderator" | "user";

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
  preferred_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  user_id: string;
  role: AppRole;
  created_at?: string;
}

export interface AuthError extends Error {
  status?: number;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: AuthError;
}

export interface DialogState<T> {
  isOpen: boolean;
  item: T | null;
}
