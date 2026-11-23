import { describe, it, expect } from 'vitest';
import { healthFrom, STALE_AFTER_MS } from './check-health';

const now = new Date('2026-11-23T12:00:00Z').getTime();

describe('healthFrom', () => {
  it('returns UNKNOWN when the monitor was never checked', () => {
    expect(healthFrom(null, now)).toBe('UNKNOWN');
  });

  it('returns the status of a recent check', () => {
    expect(healthFrom({ status: 'UP', checkedAt: new Date(now - 30_000) }, now)).toBe('UP');
    expect(healthFrom({ status: 'DOWN', checkedAt: new Date(now - 30_000) }, now)).toBe('DOWN');
  });

  it('returns UNKNOWN when the last check is too old', () => {
    const checkedAt = new Date(now - STALE_AFTER_MS - 1);

    expect(healthFrom({ status: 'UP', checkedAt }, now)).toBe('UNKNOWN');
  });
});
