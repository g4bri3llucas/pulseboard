import { prisma } from '../../config/prisma';

export class MonitorNotPublicError extends Error {}

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos

export const statusService = {
  async getBySlug(slug: string) {
    const monitor = await prisma.monitor.findUnique({ where: { slug } });

    if (!monitor || !monitor.isPublic) {
      throw new MonitorNotPublicError('Status page not found');
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [lastCheck, recentChecks, incidents] = await Promise.all([
      prisma.check.findFirst({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: 'desc' },
      }),
      prisma.check.findMany({
        where: { monitorId: monitor.id, checkedAt: { gte: last24h } },
      }),
      prisma.incident.findMany({
        where: { monitorId: monitor.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: { startedAt: true, resolvedAt: true },
      }),
    ]);

    const upCount = recentChecks.filter((c) => c.status === 'UP').length;
    const uptimePercentage =
      recentChecks.length > 0 ? (upCount / recentChecks.length) * 100 : 100;

    const isStale =
      !lastCheck || Date.now() - lastCheck.checkedAt.getTime() > STALE_THRESHOLD_MS;

    return {
      name: monitor.name,
      status: isStale ? 'UNKNOWN' : lastCheck!.status,
      uptimePercentage: Number(uptimePercentage.toFixed(2)),
      incidents,
    };
  },
};