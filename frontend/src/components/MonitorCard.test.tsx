import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MonitorCard } from './MonitorCard';
import type { Monitor } from '../types/monitor';

function buildMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    id: 'm1',
    name: 'Minha API',
    url: 'https://api.example.com',
    interval: 60,
    isPublic: false,
    slug: 'minha-api-abc123',
    createdAt: '2026-11-23T00:00:00.000Z',
    status: 'UP',
    lastCheck: { status: 'UP', responseTime: 182, checkedAt: new Date().toISOString() },
    uptime24h: 99.5,
    ...overrides,
  };
}

function renderCard(monitor: Monitor) {
  render(
    <MemoryRouter>
      <MonitorCard monitor={monitor} onEdit={vi.fn()} onDelete={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('MonitorCard', () => {
  it('shows status, response time, uptime and when it was checked', () => {
    renderCard(buildMonitor());

    expect(screen.getByText('Up')).toBeInTheDocument();
    expect(screen.getByText(/182 ms/)).toBeInTheDocument();
    expect(screen.getByText(/99.5% uptime \(24h\)/)).toBeInTheDocument();
    expect(screen.getByText(/checked just now/)).toBeInTheDocument();
  });

  it('shows Down when the last check failed', () => {
    renderCard(
      buildMonitor({
        status: 'DOWN',
        lastCheck: { status: 'DOWN', responseTime: null, checkedAt: new Date().toISOString() },
      }),
    );

    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.queryByText(/ms ·/)).not.toBeInTheDocument();
  });

  it('shows No data for a monitor that was never checked', () => {
    renderCard(buildMonitor({ status: 'UNKNOWN', lastCheck: null, uptime24h: null }));

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText(/No uptime data yet/)).toBeInTheDocument();
  });

  it('links to the status page only when the monitor is public', () => {
    renderCard(buildMonitor({ isPublic: true }));

    expect(screen.getByRole('link', { name: 'Status page' })).toHaveAttribute(
      'href',
      '/status/minha-api-abc123',
    );
  });

  it('hides the status page link for private monitors', () => {
    renderCard(buildMonitor());

    expect(screen.queryByRole('link', { name: 'Status page' })).not.toBeInTheDocument();
  });
});
