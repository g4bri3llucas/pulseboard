import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../services/api';

function SessionInfo() {
  const { user, sessionExpired } = useAuth();

  return (
    <p>
      {user ? `signed in as ${user.name}` : 'signed out'}
      {sessionExpired && ' (expired)'}
    </p>
  );
}

async function unauthorizedAdapter(config: InternalAxiosRequestConfig): Promise<never> {
  throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
    status: 401,
    statusText: 'Unauthorized',
    data: {},
    headers: {},
    config,
  });
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Lucas', email: 'lucas@test.com' }));
  });

  it('signs the user out when the API rejects the token', async () => {
    render(
      <AuthProvider>
        <SessionInfo />
      </AuthProvider>,
    );

    expect(screen.getByText('signed in as Lucas')).toBeInTheDocument();

    await act(async () => {
      await api.get('/monitors', { adapter: unauthorizedAdapter }).catch(() => undefined);
    });

    expect(screen.getByText('signed out (expired)')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
