/**
 * Subdomain-based tenant detection utilities.
 *
 * Reads VITE_BASE_DOMAIN from environment (e.g. "testdomain.com" or "localhost").
 * Extracts the subdomain from the current hostname and maps it to an org slug.
 */

const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || 'localhost';

/**
 * Extracts the organisation slug from the current subdomain.
 *
 * Examples (with BASE_DOMAIN = "testdomain.com"):
 *   "acme.testdomain.com"  → "acme"
 *   "testdomain.com"       → null
 *   "localhost"             → null
 *
 * Examples (with BASE_DOMAIN = "localhost"):
 *   "acme.localhost"        → "acme"
 *   "localhost"             → null
 */
export function getSubdomainSlug(): string | null {
  const hostname = window.location.hostname;

  // Exact match with base domain — no subdomain
  if (hostname === BASE_DOMAIN) return null;

  const suffix = `.${BASE_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, -suffix.length);

  // Must be a single label (no dots) and non-empty
  if (!subdomain || subdomain.includes('.')) return null;

  return subdomain.toLowerCase();
}

/**
 * Builds a full URL for a given org slug subdomain.
 *
 * Example: buildSubdomainUrl("acme") → "https://acme.testdomain.com"
 */
export function buildSubdomainUrl(slug: string): string {
  const protocol = window.location.protocol;
  const port = window.location.port;
  const host = `${slug}.${BASE_DOMAIN}`;

  // Include port for dev (e.g. acme.localhost:5173)
  return port && port !== '80' && port !== '443'
    ? `${protocol}//${host}:${port}`
    : `${protocol}//${host}`;
}
