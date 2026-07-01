import TIMELINE_TEMPLATE from '../timeline-config.js';

export { TIMELINE_TEMPLATE };

export function buildDefaultTlState() {
  const state = {};
  TIMELINE_TEMPLATE.forEach(section => section.events.forEach(e => { state[e.id] = false; }));
  return state;
}

// Resolves display time/label for each event given the current race start (or null if not started).
export function resolveTimeline(raceStart) {
  return TIMELINE_TEMPLATE.map(section => ({
    ...section,
    events: section.events.map(e => ({
      ...e,
      time: raceStart ? raceStart.getTime() + e.offsetMs : null,
      display: raceStart
        ? new Date(raceStart.getTime() + e.offsetMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : (e.offsetMs === 0 ? 'Start' : (e.offsetMs < 0 ? `${Math.round(-e.offsetMs / 60000)}min before start` : `+${Math.round(e.offsetMs / 60000)}min`)),
    })),
  }));
}

export function findNextEvent(resolved, now) {
  const ms = now.getTime();
  for (const section of resolved) {
    for (const event of section.events) {
      if (event.time != null && event.time > ms) return event.id;
    }
  }
  return null;
}
