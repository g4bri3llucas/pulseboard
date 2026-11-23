import { monitorRepository } from './monitor.repository';
import { checkRepository } from '../checks/check.repository';
import { healthFrom } from '../checks/check-health';
import slugify from 'slugify';
import { randomBytes } from 'crypto';

const DAY_MS = 24 * 60 * 60 * 1000;

export class MonitorNotFoundError extends Error {}
export class MonitorForbiddenError extends Error {}

function generateSlug(name: string): string {
  const base = slugify(name, { lower: true, strict: true });
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

async function getOwnedMonitor(id: string, userId: string) {
  const monitor = await monitorRepository.findById(id);

  if (!monitor) {
    throw new MonitorNotFoundError('Monitor not found');
  }

  if (monitor.userId !== userId) {
    throw new MonitorForbiddenError('You do not have access to this monitor');
  }

  return monitor;
}

export const monitorService = {
  create(userId: string, input: { name: string; url: string; interval?: number; isPublic?: boolean }) {
    return monitorRepository.create({
      name: input.name,
      url: input.url,
      interval: input.interval ?? 60,
      isPublic: input.isPublic ?? false,
      slug: generateSlug(input.name),
      userId,
    });
  },

  async listByUser(userId: string) {
    const monitors = await monitorRepository.findAllByUser(userId);
    const ids = monitors.map((monitor) => monitor.id);

    const [latestChecks, statusCounts] = await Promise.all([
      checkRepository.findLatestByMonitors(ids),
      checkRepository.countByStatusSince(ids, new Date(Date.now() - DAY_MS)),
    ]);

    const latestByMonitor = new Map(latestChecks.map((check) => [check.monitorId, check]));

    return monitors.map((monitor) => {
      const lastCheck = latestByMonitor.get(monitor.id) ?? null;
      const counts = statusCounts.filter((count) => count.monitorId === monitor.id);
      const total = counts.reduce((sum, count) => sum + count._count._all, 0);
      const up = counts.find((count) => count.status === 'UP')?._count._all ?? 0;

      return {
        ...monitor,
        status: healthFrom(lastCheck),
        lastCheck: lastCheck && {
          status: lastCheck.status,
          responseTime: lastCheck.responseTime,
          checkedAt: lastCheck.checkedAt,
        },
        uptime24h: total > 0 ? Number(((up / total) * 100).toFixed(2)) : null,
      };
    });
  },

  async getById(id: string, userId: string) {
    return getOwnedMonitor(id, userId);
  },

  async update(
    id: string,
    userId: string,
    input: Partial<{ name: string; url: string; interval: number; isPublic: boolean }>,
  ) {
    await getOwnedMonitor(id, userId);
    return monitorRepository.update(id, input);
  },

  async delete(id: string, userId: string) {
    await getOwnedMonitor(id, userId);
    return monitorRepository.delete(id);
  },
};