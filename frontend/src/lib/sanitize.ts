/**
 * Input sanitization utilities for secure form handling
 */

/**
 * Sanitize text input by removing potential XSS vectors
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize and validate email format
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize phone number - keep only digits and common separators
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number, options?: { min?: number; max?: number; decimals?: number }): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(num)) return 0;
  
  let result = num;
  if (options?.min !== undefined) result = Math.max(result, options.min);
  if (options?.max !== undefined) result = Math.min(result, options.max);
  if (options?.decimals !== undefined) result = Number(result.toFixed(options.decimals));
  
  return result;
}

/**
 * Sanitize URL - validate and clean
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Escape HTML entities in a string (for display purposes)
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Validate and sanitize date string (YYYY-MM-DD format)
 */
export function sanitizeDate(dateStr: string): string {
  if (!dateStr) return '';
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return dateStr;
}

/**
 * Remove all HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
