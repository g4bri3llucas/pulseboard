import { monitorRepository } from '../monitors/monitor.repository';
import { checkRepository } from '../checks/check.repository';
import { incidentRepository } from '../incidents/incident.repository';
import { emailService } from '../notifications/email.service';

const TIMEOUT_MS = 10_000;

interface DueMonitor {
  id: string;
  name: string;
  url: string;
  user: { email: string };
}

async function pingUrl(url: string): Promise<{ ok: boolean; responseTime: number }> {
  const start = Date.now();

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const responseTime = Date.now() - start;
    await response.body?.cancel();

    return { ok: response.status < 400, responseTime };
  } catch {
    return { ok: false, responseTime: Date.now() - start };
  }
}

async function notify(monitor: DueMonitor, kind: 'opened' | 'resolved') {
  try {
    await emailService.sendIncidentAlert(monitor.user.email, monitor.name, kind);
  } catch (error) {
    console.error(`[email failed] monitor ${monitor.id}:`, error);
  }
}

async function checkMonitor(monitor: DueMonitor) {
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
    await notify(monitor, 'opened');
  }

  if (ok && openIncident) {
    await incidentRepository.resolve(openIncident.id);
    console.log(`[incident resolved] monitor ${monitor.id}`);
    await notify(monitor, 'resolved');
  }
}

export const monitoringService = {
  async runDueChecks(now: number = Date.now()) {
    const monitors = await monitorRepository.findAllWithOwnerEmail();
    const latestChecks = await checkRepository.findLatestByMonitors(
      monitors.map((monitor) => monitor.id),
    );
    const lastCheckedAt = new Map(
      latestChecks.map((check) => [check.monitorId, check.checkedAt.getTime()]),
    );

    const dueMonitors = monitors.filter((monitor) => {
      const checkedAt = lastCheckedAt.get(monitor.id);
      return checkedAt === undefined || now - checkedAt >= monitor.interval * 1000;
    });

    const results = await Promise.allSettled(dueMonitors.map(checkMonitor));

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[check failed] monitor ${dueMonitors[index].id}:`, result.reason);
      }
    });

    return dueMonitors.length;
  },
};
