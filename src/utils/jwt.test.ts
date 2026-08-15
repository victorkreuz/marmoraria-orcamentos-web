import { describe, it, expect } from 'vitest';
import { isTokenExpired } from './jwt';

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('isTokenExpired', () => {
  it('returns false for a token whose exp is in the future', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for a token whose exp is in the past', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for a token missing the exp claim', () => {
    const token = makeToken({ sub: 'admin' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for a malformed token', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });

  it('returns true for an empty string', () => {
    expect(isTokenExpired('')).toBe(true);
  });

  it('returns true for an exp that overflows to Infinity', () => {
    const token = makeToken({ exp: 1e400 });
    expect(isTokenExpired(token)).toBe(true);
  });
});
