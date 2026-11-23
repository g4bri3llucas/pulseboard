import { describe, it, expect, vi, afterEach } from 'vitest';
import { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { api, setUnauthorizedHandler } from './api';

function failWith(status: number) {
  return async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
      status,
      statusText: '',
      data: {},
      headers: {},
      config,
    });
  };
}

afterEach(() => {
  setUnauthorizedHandler(null);
});

describe('api 401 handling', () => {
  it('calls the unauthorized handler when a protected request returns 401', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(api.get('/monitors', { adapter: failWith(401) })).rejects.toThrow();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores 401 from the login route, which means wrong credentials', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(api.post('/auth/login', {}, { adapter: failWith(401) })).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores other errors', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(api.get('/monitors', { adapter: failWith(500) })).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });
});
