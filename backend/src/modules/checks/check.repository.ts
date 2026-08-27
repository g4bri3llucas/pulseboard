import { prisma } from '../../config/prisma';
import { CheckStatus } from '../../generated/prisma/client';

export const checkRepository = {
  create(data: { monitorId: string; status: CheckStatus; responseTime: number | null }) {
    return prisma.check.create({ data });
  },
};