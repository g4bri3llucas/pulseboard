import { monitorRepository } from './monitor.repository';
import slugify from 'slugify';
import { randomBytes } from 'crypto';

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

  listByUser(userId: string) {
    return monitorRepository.findAllByUser(userId);
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