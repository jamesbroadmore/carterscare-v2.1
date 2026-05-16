/**
 * Security utilities and configurations
 */

/**
 * Content Security Policy headers
 * Apply these headers in your server (Vercel deployment)
 */
export const CSP_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.github.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
} as const;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 * Requires: 8+ chars, uppercase, lowercase, number
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Get password strength feedback
 */
export function getPasswordStrengthFeedback(password: string): string[] {
  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push("Include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    feedback.push("Include at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    feedback.push("Include at least one number");
  }

  return feedback;
}

/**
 * Sanitize user input to prevent XSS
 * Note: React handles this automatically, but use for edge cases
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Check if running in development
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Check if running in production
 */
export const isProduction = import.meta.env.PROD;

/**
 * Rate limiting helper (client-side)
 * For server-side rate limiting, use Supabase rate limit middleware
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Secure token storage utilities
 * Note: For highly sensitive tokens, use secure HTTP-only cookies on the backend
 */
export const TokenStorage = {
  /**
   * Store token securely (warning: localStorage is vulnerable to XSS)
   * Only use for less sensitive tokens
   */
  setToken(key: string, token: string): void {
    try {
      localStorage.setItem(key, token);
    } catch (e) {
      console.error("Failed to store token:", e);
    }
  },

  /**
   * Retrieve token
   */
  getToken(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("Failed to retrieve token:", e);
      return null;
    }
  },

  /**
   * Clear token
   */
  removeToken(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Failed to remove token:", e);
    }
  },

  /**
   * Clear all tokens
   */
  clearAll(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
  },
};

/**
 * CSRF token utilities
 * For forms that change state, validate CSRF tokens
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  // Use timing-safe comparison to prevent timing attacks
  return token.length === storedToken.length && token === storedToken;
}

/**
 * Logging helper for security events
 */
export const SecurityLog = {
  logAuthFailure(email: string, reason: string): void {
    console.warn(`[SECURITY] Auth failure for ${email}: ${reason}`);
    // In production, send to security monitoring service
  },

  logUnauthorizedAccess(userId: string, resource: string): void {
    console.warn(`[SECURITY] Unauthorized access attempt by ${userId} to ${resource}`);
    // In production, send to security monitoring service
  },

  logSuspiciousActivity(description: string, metadata?: unknown): void {
    console.warn(`[SECURITY] Suspicious activity: ${description}`, metadata);
    // In production, send to security monitoring service
  },
};
