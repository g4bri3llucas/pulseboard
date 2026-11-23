import { describe, it, expect } from 'vitest';
import { timeAgo } from './time-ago';

const now = new Date('2026-11-23T12:00:00Z').getTime();

function secondsBefore(seconds: number): string {
  return new Date(now - seconds * 1000).toISOString();
}

describe('timeAgo', () => {
  it('formats recent moments', () => {
    expect(timeAgo(secondsBefore(2), now)).toBe('just now');
    expect(timeAgo(secondsBefore(20), now)).toBe('20s ago');
  });

  it('formats minutes, hours and days', () => {
    expect(timeAgo(secondsBefore(5 * 60), now)).toBe('5m ago');
    expect(timeAgo(secondsBefore(3 * 60 * 60), now)).toBe('3h ago');
    expect(timeAgo(secondsBefore(2 * 24 * 60 * 60), now)).toBe('2d ago');
  });

  it('never shows a negative time when clocks drift', () => {
    expect(timeAgo(secondsBefore(-10), now)).toBe('just now');
  });
});
