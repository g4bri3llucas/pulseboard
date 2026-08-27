import { prisma } from '../../config/prisma';

export const incidentRepository = {
  findOpenByMonitor(monitorId: string) {
    return prisma.incident.findFirst({
      where: { monitorId, resolvedAt: null },
    });
  },

  open(monitorId: string) {
    return prisma.incident.create({ data: { monitorId } });
  },

  resolve(id: string) {
    return prisma.incident.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  },
};