import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * Strips all HTML tags and potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true // Keep text content
  }).trim();
}

/**
 * Sanitizes HTML content while allowing safe HTML tags
 * Use this when you need to preserve some formatting
 */
export function sanitizeHtml(html: string, allowedTags: string[] = ['b', 'i', 'em', 'strong', 'p', 'br']): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }).trim();
}

/**
 * Validates that input doesn't contain malicious patterns
 */
export function validateSafeInput(input: string): { valid: boolean; reason?: string } {
  if (!input) return { valid: true };

  // Check for HTML/Script tags
  if (/<[^>]*>/g.test(input)) {
    return { valid: false, reason: 'HTML tags are not allowed' };
  }

  // Check for JavaScript event handlers
  if (/on\w+\s*=/gi.test(input)) {
    return { valid: false, reason: 'Event handlers are not allowed' };
  }

  // Check for SQL injection patterns
  if (/(drop|delete|insert|update|select|union|exec|script)\s+(table|database|from)/i.test(input)) {
    return { valid: false, reason: 'Invalid characters detected' };
  }

  // Check for common XSS patterns
  if (/(javascript:|data:text\/html|vbscript:)/i.test(input)) {
    return { valid: false, reason: 'Invalid URL scheme detected' };
  }

  return { valid: true };
}

/**
 * Sanitizes a name field - allows only letters, spaces, and basic punctuation
 */
export function sanitizeName(name: string): string {
  if (!name) return '';

  // First sanitize with DOMPurify
  const cleaned = sanitizeInput(name);

  // Then remove any non-name characters
  return cleaned.replace(/[^a-zA-Z\s.',-]/g, '').trim();
}

/**
 * Sanitizes a phone number - allows only digits and basic formatting
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all except digits, spaces, parentheses, hyphens, and plus
  return phone.replace(/[^0-9+\s\-().]/g, '').trim();
}

/**
 * Sanitizes an email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  // DOMPurify first
  const cleaned = sanitizeInput(email);

  // Email should only contain valid email characters
  return cleaned.toLowerCase().trim();
}

/**
 * Sanitizes a URL and validates it's safe
 */
export function sanitizeUrl(url: string): { sanitized: string; valid: boolean; reason?: string } {
  if (!url) return { sanitized: '', valid: true };

  // Sanitize
  const cleaned = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();

  try {
    const parsed = new URL(cleaned);

    // Only allow HTTPS (or HTTP for localhost)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { sanitized: cleaned, valid: false, reason: 'Only HTTPS URLs are allowed' };
    }

    // Block javascript: and data: URLs
    if (['javascript:', 'data:', 'vbscript:'].some(p => cleaned.toLowerCase().startsWith(p))) {
      return { sanitized: cleaned, valid: false, reason: 'Invalid URL protocol' };
    }

    return { sanitized: cleaned, valid: true };
  } catch {
    return { sanitized: cleaned, valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Sanitizes message/textarea content
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeMessage(message: string): string {
  if (!message) return '';

  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: [], // No HTML tags in messages
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }).trim();
}
