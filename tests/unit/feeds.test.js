import { describe, it, expect } from 'vitest';
import { haversineMeters, calcPace, calcFeedStats } from '../../src/feeds.js';

describe('haversineMeters', () => {
  it('returns ~0 for identical points', () => {
    const p = { lat: 45.0, lng: -116.0 };
    expect(haversineMeters(p, p)).toBeCloseTo(0, 1);
  });

  it('returns a reasonable distance for points ~100m apart', () => {
    const a = { lat: 45.0, lng: -116.0 };
    const b = { lat: 45.0009, lng: -116.0 }; // ~100m north
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(110);
  });
});

describe('calcPace', () => {
  it('returns null when there is no previous feed', () => {
    expect(calcPace(null, { timestamp: 1000 })).toBeNull();
  });

  it('computes pace from GPS distance and elapsed time', () => {
    const prev = { timestamp: 0, location: { method: 'gps', lat: 45.0, lng: -116.0 } };
    const feed = { timestamp: 30 * 60000, location: { method: 'gps', lat: 45.0009, lng: -116.0 } }; // ~100m in 30min
    const pace = calcPace(prev, feed);
    expect(pace).toBeGreaterThan(25);
    expect(pace).toBeLessThan(35);
  });

  it('falls back to manual cumulative distance', () => {
    const prev = { timestamp: 0, location: { method: 'manual', distanceM: 1000 } };
    const feed = { timestamp: 30 * 60000, location: { method: 'manual', distanceM: 1100 } };
    const pace = calcPace(prev, feed);
    expect(pace).toBeCloseTo(30, 0);
  });

  it('returns null when distance does not increase', () => {
    const prev = { timestamp: 0, location: { method: 'manual', distanceM: 1000 } };
    const feed = { timestamp: 30 * 60000, location: { method: 'manual', distanceM: 1000 } };
    expect(calcPace(prev, feed)).toBeNull();
  });
});

describe('calcFeedStats', () => {
  it('returns null for an athlete with no feeds', () => {
    expect(calcFeedStats([], 'a1')).toBeNull();
  });

  it('aggregates gels, drinks, and avg transition time for one athlete', () => {
    const feeds = [
      { athlete_id: 'a1', given: { drink: true, gel: 1, water: false }, transitionSec: 30, timestamp: 0 },
      { athlete_id: 'a1', given: { drink: true, gel: 2, water: true }, transitionSec: 60, timestamp: 1000 },
      { athlete_id: 'a2', given: { drink: true, gel: 5, water: false }, transitionSec: 999, timestamp: 500 },
    ];
    const stats = calcFeedStats(feeds, 'a1');
    expect(stats.count).toBe(2);
    expect(stats.gels).toBe(3);
    expect(stats.drinks).toBe(2);
    expect(stats.avgTransitionSec).toBe(45);
  });
});
