import { describe, it, expect } from 'vitest';
import checklist from '../../checklist-config.js';
import timeline from '../../timeline-config.js';

// These configs are meant to be hand-edited before each event -- validate
// their shape so a typo shows up here, not mid-swim.

describe('checklist-config', () => {
  it('has unique section ids', () => {
    const ids = checklist.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique item ids across all sections', () => {
    const ids = checklist.flatMap(s => s.items.map(i => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has a non-empty id and text', () => {
    checklist.forEach(section => section.items.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.text).toBeTruthy();
    }));
  });
});

describe('timeline-config', () => {
  it('has unique event ids across all sections', () => {
    const ids = timeline.flatMap(s => s.events.map(e => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has exactly one isStart event, offset at 0', () => {
    const starts = timeline.flatMap(s => s.events).filter(e => e.isStart);
    expect(starts.length).toBe(1);
    expect(starts[0].offsetMs).toBe(0);
  });

  it('every event has a numeric offsetMs and non-empty label', () => {
    timeline.forEach(section => section.events.forEach(event => {
      expect(typeof event.offsetMs).toBe('number');
      expect(event.label).toBeTruthy();
    }));
  });
});
