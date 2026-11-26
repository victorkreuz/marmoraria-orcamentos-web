import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { describeLoadError, isAuthError } from './loadError';

function httpError(status: number): AxiosError {
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {} as never,
  });
}

describe('describeLoadError', () => {
  it('returns null for 401 and 403 (the login redirect handles them)', () => {
    expect(describeLoadError(httpError(401))).toBeNull();
    expect(describeLoadError(httpError(403))).toBeNull();
    expect(isAuthError(httpError(401))).toBe(true);
  });

  it('returns a message for 500 errors', () => {
    expect(describeLoadError(httpError(500))).toMatch(/servidor/i);
  });

  it('returns a connection message when there is no response', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(describeLoadError(err)).toMatch(/conectar/i);
  });

  it('returns a timeout message for ECONNABORTED', () => {
    const err = new AxiosError('timeout', 'ECONNABORTED');
    expect(describeLoadError(err)).toMatch(/demorou/i);
  });

  it('returns a generic message for non-axios errors and other statuses', () => {
    expect(describeLoadError(new Error('boom'))).toBeTruthy();
    expect(describeLoadError(httpError(404))).toBeTruthy();
  });
});
