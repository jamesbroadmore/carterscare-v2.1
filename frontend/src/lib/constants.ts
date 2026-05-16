/**
 * Application-wide constants
 */

export const APP_ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
} as const;

export const GRADIENT_PRESETS = {
  PINK: "linear-gradient(135deg, #f472b6, #ec4899)",
  ORANGE: "linear-gradient(135deg, #fb923c, #f97316)",
  AMBER: "linear-gradient(135deg, #fbbf24, #f59e0b)",
  GREEN: "linear-gradient(135deg, #4ade80, #22c55e)",
  BLUE: "linear-gradient(135deg, #60a5fa, #3b82f6)",
  PURPLE: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  TEAL: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
  BRAND_PURPLE_BLUE: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
  BRAND_RAINBOW: "linear-gradient(90deg, #8b5cf6, #60a5fa, #4ade80)",
} as const;

export const AVATAR_GRADIENT_COLORS = [
  GRADIENT_PRESETS.PINK,
  GRADIENT_PRESETS.ORANGE,
  GRADIENT_PRESETS.AMBER,
  GRADIENT_PRESETS.GREEN,
  GRADIENT_PRESETS.BLUE,
  GRADIENT_PRESETS.PURPLE,
  GRADIENT_PRESETS.TEAL,
] as const;

export const STATUS_COLORS = {
  ACTIVE: GRADIENT_PRESETS.GREEN,
  INACTIVE: "linear-gradient(135deg, #ef4444, #dc2626)",
  PENDING: GRADIENT_PRESETS.AMBER,
  ARCHIVED: "linear-gradient(135deg, #6b7280, #4b5563)",
} as const;

export const QUERY_KEYS = {
  DASHBOARD_GREETING: "dashboard-greeting",
  DASHBOARD_STAFF_COUNT: "dashboard-staff-count",
  STAFF: "staff",
  CLIENTS: "clients",
  ROSTER: "roster",
  TIMESHEETS: "timesheets",
  USER_ROLES: "user-roles",
} as const;

export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION: "Please check your input and try again.",
} as const;
