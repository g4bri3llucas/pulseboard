import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './Dashboard';
import { useAuth } from '../hooks/useAuth';
import { monitorService } from '../services/monitor.service';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/monitor.service', () => ({
  monitorService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', name: 'Lucas', email: 'lucas@test.com' },
      login: vi.fn(),
      logout: vi.fn(),
      sessionExpired: false,
    });
    vi.mocked(monitorService.list).mockResolvedValue([
      {
        id: 'm1',
        name: 'Minha API',
        url: 'https://api.example.com',
        interval: 60,
        isPublic: false,
        slug: 'minha-api-abc123',
        createdAt: '2026-11-23T00:00:00.000Z',
        status: 'UNKNOWN',
        lastCheck: null,
        uptime24h: null,
      },
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows an error when deleting a monitor fails', async () => {
    vi.mocked(monitorService.remove).mockRejectedValue(new Error('500'));
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole('button', { name: /delete/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the monitor');
    expect(monitorService.remove).toHaveBeenCalledWith('m1');
  });
});
