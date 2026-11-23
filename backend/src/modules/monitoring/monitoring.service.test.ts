import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monitoringService } from './monitoring.service';
import { monitorRepository } from '../monitors/monitor.repository';
import { checkRepository } from '../checks/check.repository';
import { incidentRepository } from '../incidents/incident.repository';
import { emailService } from '../notifications/email.service';

vi.mock('../monitors/monitor.repository', () => ({
  monitorRepository: { findAllWithOwnerEmail: vi.fn() },
}));

vi.mock('../checks/check.repository', () => ({
  checkRepository: { create: vi.fn(), findLatestByMonitors: vi.fn() },
}));

vi.mock('../incidents/incident.repository', () => ({
  incidentRepository: { findOpenByMonitor: vi.fn(), open: vi.fn(), resolve: vi.fn() },
}));

vi.mock('../notifications/email.service', () => ({
  emailService: { sendIncidentAlert: vi.fn() },
}));

const now = new Date('2026-11-23T12:00:00Z').getTime();
const fetchMock = vi.fn();

function monitor(id: string, interval = 60) {
  return {
    id,
    name: `Monitor ${id}`,
    url: `https://${id}.example.com`,
    interval,
    user: { email: 'dono@test.com' },
  };
}

function lastChecked(monitorId: string, secondsAgo: number) {
  return {
    monitorId,
    status: 'UP' as const,
    responseTime: 100,
    checkedAt: new Date(now - secondsAgo * 1000),
  };
}

function siteResponds(status: number) {
  fetchMock.mockResolvedValue(new Response(null, { status }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.mocked(checkRepository.findLatestByMonitors).mockResolvedValue([]);
  vi.mocked(incidentRepository.findOpenByMonitor).mockResolvedValue(null);
});

describe('monitoringService.runDueChecks', () => {
  it('checks only monitors whose interval has passed', async () => {
    vi.mocked(monitorRepository.findAllWithOwnerEmail).mockResolvedValue([
      monitor('never-checked'),
      monitor('recent'),
      monitor('overdue'),
    ]);
    vi.mocked(checkRepository.findLatestByMonitors).mockResolvedValue([
      lastChecked('recent', 30),
      lastChecked('overdue', 90),
    ]);
    siteResponds(200);

    const checked = await monitoringService.runDueChecks(now);

    expect(checked).toBe(2);
    const checkedIds = vi.mocked(checkRepository.create).mock.calls.map(([data]) => data.monitorId);
    expect(checkedIds.sort()).toEqual(['never-checked', 'overdue']);
  });

  it('opens an incident and sends an alert on the first failure', async () => {
    vi.mocked(monitorRepository.findAllWithOwnerEmail).mockResolvedValue([monitor('api')]);
    siteResponds(503);

    await monitoringService.runDueChecks(now);

    expect(checkRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ monitorId: 'api', status: 'DOWN' }),
    );
    expect(incidentRepository.open).toHaveBeenCalledWith('api');
    expect(emailService.sendIncidentAlert).toHaveBeenCalledWith(
      'dono@test.com',
      'Monitor api',
      'opened',
    );
  });

  it('does not open a second incident while one is still open', async () => {
    vi.mocked(monitorRepository.findAllWithOwnerEmail).mockResolvedValue([monitor('api')]);
    vi.mocked(incidentRepository.findOpenByMonitor).mockResolvedValue({
      id: 'inc-1',
      monitorId: 'api',
      startedAt: new Date(now - 60_000),
      resolvedAt: null,
    });
    siteResponds(500);

    await monitoringService.runDueChecks(now);

    expect(incidentRepository.open).not.toHaveBeenCalled();
    expect(emailService.sendIncidentAlert).not.toHaveBeenCalled();
  });

  it('resolves the open incident when the site responds again', async () => {
    vi.mocked(monitorRepository.findAllWithOwnerEmail).mockResolvedValue([monitor('api')]);
    vi.mocked(incidentRepository.findOpenByMonitor).mockResolvedValue({
      id: 'inc-1',
      monitorId: 'api',
      startedAt: new Date(now - 60_000),
      resolvedAt: null,
    });
    siteResponds(200);

    await monitoringService.runDueChecks(now);

    expect(incidentRepository.resolve).toHaveBeenCalledWith('inc-1');
    expect(emailService.sendIncidentAlert).toHaveBeenCalledWith(
      'dono@test.com',
      'Monitor api',
      'resolved',
    );
  });

  it('treats a network error as DOWN', async () => {
    vi.mocked(monitorRepository.findAllWithOwnerEmail).mockResolvedValue([monitor('api')]);
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await monitoringService.runDueChecks(now);

    expect(checkRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ monitorId: 'api', status: 'DOWN' }),
    );
    expect(incidentRepository.open).toHaveBeenCalledWith('api');
  });

  it('keeps going when an alert or another monitor fails', async () => {
    vi.mocked(monitorRepository.findAllWithOwnerEmail).mockResolvedValue([
      monitor('broken'),
      monitor('api'),
    ]);
    vi.mocked(emailService.sendIncidentAlert).mockRejectedValue(new Error('SMTP down'));
    vi.mocked(checkRepository.create).mockImplementation(async (data) => {
      if (data.monitorId === 'broken') {
        throw new Error('db hiccup');
      }
      return { id: 'c1', checkedAt: new Date(now), ...data };
    });
    siteResponds(503);

    await expect(monitoringService.runDueChecks(now)).resolves.toBe(2);

    expect(incidentRepository.open).toHaveBeenCalledWith('api');
    expect(incidentRepository.open).not.toHaveBeenCalledWith('broken');
  });
});
