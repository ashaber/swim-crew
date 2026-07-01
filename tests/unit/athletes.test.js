import { describe, it, expect } from 'vitest';
import { newAthlete, findAthlete, resolveActiveId, nextAthleteId } from '../../src/athletes.js';

describe('newAthlete', () => {
  it('creates an athlete with a uuid and active flag', () => {
    const a = newAthlete('Jess', 10);
    expect(a.name).toBe('Jess');
    expect(a.targetDistanceKm).toBe(10);
    expect(a.active).toBe(true);
    expect(a.id).toBeTruthy();
  });
});

describe('resolveActiveId', () => {
  const athletes = [newAthlete('A'), newAthlete('B')];

  it('keeps the requested id if valid', () => {
    expect(resolveActiveId(athletes, athletes[1].id)).toBe(athletes[1].id);
  });

  it('falls back to the first athlete if requested id is invalid', () => {
    expect(resolveActiveId(athletes, 'bogus')).toBe(athletes[0].id);
  });

  it('returns null when there are no athletes', () => {
    expect(resolveActiveId([], 'bogus')).toBeNull();
  });
});

describe('nextAthleteId', () => {
  const athletes = [newAthlete('A'), newAthlete('B'), newAthlete('C')];

  it('wraps forward past the end of the list', () => {
    expect(nextAthleteId(athletes, athletes[2].id, 1)).toBe(athletes[0].id);
  });

  it('wraps backward past the start of the list', () => {
    expect(nextAthleteId(athletes, athletes[0].id, -1)).toBe(athletes[2].id);
  });

  it('returns null for an empty list', () => {
    expect(nextAthleteId([], 'x', 1)).toBeNull();
  });
});
