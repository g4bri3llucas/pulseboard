import { prisma } from '../../config/prisma';

export const monitorRepository = {
  create(data: {
    name: string;
    url: string;
    interval: number;
    isPublic: boolean;
    slug: string;
    userId: string;
  }) {
    return prisma.monitor.create({ data });
  },

  findAllWithOwnerEmail() {
    return prisma.monitor.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        interval: true,
        user: { select: { email: true } },
      },
    });
  },

  findAllByUser(userId: string) {
    return prisma.monitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.monitor.findUnique({ where: { id } });
  },

  update(id: string, data: Partial<{ name: string; url: string; interval: number; isPublic: boolean }>) {
    return prisma.monitor.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.monitor.delete({ where: { id } });
  },
};