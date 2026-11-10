// Browser-safe.

/** Only same-site office paths are allowed as post-sign-in destinations (no open redirects). */
export function safeOfficePath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 300) return null;
  return /^\/office(\/[A-Za-z0-9\-/]*)?(\?[A-Za-z0-9=&%\-_.]*)?$/.test(value) && !value.includes('//') ? value : null;
}
