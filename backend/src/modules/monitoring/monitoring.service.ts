import { prisma } from '../../config/prisma';
import { checkRepository } from '../checks/check.repository';
import { incidentRepository } from '../incidents/incident.repository';
import { emailService } from '../notifications/email.service';

const TIMEOUT_MS = 10_000;

async function pingUrl(url: string): Promise<{ ok: boolean; responseTime: number }> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    return { ok: response.status < 400, responseTime: Date.now() - start };
  } catch {
    return { ok: false, responseTime: Date.now() - start };
  }
}

async function checkMonitor(monitor: { id: string; url: string; name: string; userId: string }) {
  const { ok, responseTime } = await pingUrl(monitor.url);

  await checkRepository.create({
    monitorId: monitor.id,
    status: ok ? 'UP' : 'DOWN',
    responseTime,
  });

  const openIncident = await incidentRepository.findOpenByMonitor(monitor.id);

  if (!ok && !openIncident) {
    await incidentRepository.open(monitor.id);
    console.log(`[incident opened] monitor ${monitor.id}`);

    const user = await prisma.user.findUnique({ where: { id: monitor.userId } });
    if (user) {
      await emailService.sendIncidentAlert(user.email, monitor.name, 'opened');
    }
  }

  if (ok && openIncident) {
    await incidentRepository.resolve(openIncident.id);
    console.log(`[incident resolved] monitor ${monitor.id}`);

    const user = await prisma.user.findUnique({ where: { id: monitor.userId } });
    if (user) {
      await emailService.sendIncidentAlert(user.email, monitor.name, 'resolved');
    }
  }
}

export const monitoringService = {
  async runDueChecks() {
    const monitors = await prisma.monitor.findMany();

    const dueMonitors = [];
    for (const monitor of monitors) {
      const lastCheck = await prisma.check.findFirst({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: 'desc' },
      });

      const secondsSinceLastCheck = lastCheck
        ? (Date.now() - lastCheck.checkedAt.getTime()) / 1000
        : Infinity;

      if (secondsSinceLastCheck >= monitor.interval) {
        dueMonitors.push(monitor);
      }
    }

    await Promise.all(dueMonitors.map(checkMonitor));

    return dueMonitors.length;
  },
};