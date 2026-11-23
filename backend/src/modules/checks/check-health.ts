import { CheckStatus } from '../../generated/prisma/client';

export const STALE_AFTER_MS = 5 * 60 * 1000;

export type MonitorHealth = CheckStatus | 'UNKNOWN';

export function healthFrom(
  lastCheck: { status: CheckStatus; checkedAt: Date } | null,
  now: number = Date.now(),
): MonitorHealth {
  if (!lastCheck || now - lastCheck.checkedAt.getTime() > STALE_AFTER_MS) {
    return 'UNKNOWN';
  }

  return lastCheck.status;
}
