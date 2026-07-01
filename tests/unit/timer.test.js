import { describe, it, expect } from 'vitest';
import { FEED_INTERVAL_MS, getCurrentIntervalNum, getMsUntilNextFeed } from '../../src/timer.js';

describe('getCurrentIntervalNum', () => {
  it('is interval 1 before any feed has been given', () => {
    expect(getCurrentIntervalNum(0)).toBe(1);
  });

  it('increments by one for each feed already given', () => {
    expect(getCurrentIntervalNum(1)).toBe(2);
    expect(getCurrentIntervalNum(4)).toBe(5);
  });
});

describe('getMsUntilNextFeed', () => {
  it('counts a full interval from race start when no feed has been given yet', () => {
    expect(getMsUntilNextFeed(null)).toBe(FEED_INTERVAL_MS);
  });

  it('restarts the countdown from the last feed time, not a fixed grid', () => {
    const lastFeed = new Date('2026-01-01T00:22:00Z'); // fed early, at 22 min
    const now = lastFeed; // right when it happened
    expect(getMsUntilNextFeed(lastFeed, now)).toBe(FEED_INTERVAL_MS);
  });

  it('counts down 30 minutes after the (early) last feed, independent of race start', () => {
    const lastFeed = new Date('2026-01-01T00:22:00Z');
    const now = new Date('2026-01-01T00:32:00Z'); // 10 min after that feed
    expect(getMsUntilNextFeed(lastFeed, now)).toBe(20 * 60 * 1000);
  });

  it('goes negative once overdue', () => {
    const lastFeed = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-01T00:35:00Z');
    expect(getMsUntilNextFeed(lastFeed, now)).toBe(-5 * 60 * 1000);
  });
});
