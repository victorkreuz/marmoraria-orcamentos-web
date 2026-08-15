/**
 * Decodes the payload of a JWT and checks whether its `exp` claim has passed.
 * Any parsing failure (malformed token, missing claim) is treated as expired —
 * fail-safe: when in doubt, don't treat the token as valid.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };

    if (typeof payload.exp !== 'number') return true;

    const expMs = payload.exp * 1000;
    if (!Number.isFinite(expMs)) return true;

    return expMs <= Date.now();
  } catch {
    return true;
  }
}
