import { prisma } from '../../config/prisma';
import { CheckStatus } from '../../generated/prisma/client';

export interface LatestCheck {
  monitorId: string;
  status: CheckStatus;
  responseTime: number | null;
  checkedAt: Date;
}

export const checkRepository = {
  create(data: { monitorId: string; status: CheckStatus; responseTime: number | null }) {
    return prisma.check.create({ data });
  },

  async findLatestByMonitors(monitorIds: string[]): Promise<LatestCheck[]> {
    if (monitorIds.length === 0) {
      return [];
    }

    return prisma.$queryRaw<LatestCheck[]>`
      SELECT DISTINCT ON ("monitorId") "monitorId", "status", "responseTime", "checkedAt"
      FROM "checks"
      WHERE "monitorId" = ANY(${monitorIds})
      ORDER BY "monitorId", "checkedAt" DESC
    `;
  },

  countByStatusSince(monitorIds: string[], since: Date) {
    return prisma.check.groupBy({
      by: ['monitorId', 'status'],
      where: { monitorId: { in: monitorIds }, checkedAt: { gte: since } },
      _count: { _all: true },
    });
  },
};
