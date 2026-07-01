// Offsets are in ms relative to race start (negative = before start).
export const TIMELINE_TEMPLATE = [
  {
    id: 'pre_race',
    title: 'Pre-Race',
    events: [
      { id: 'arrive',      label: 'Arrive at venue, check in',            offsetMs: -90 * 60000 },
      { id: 'crew_brief',  label: 'Brief crew on feed plan (every 30min)', offsetMs: -30 * 60000 },
      { id: 'warmup',      label: 'Athlete warmup / water entry',         offsetMs: -15 * 60000 },
      { id: 'start',       label: '🏊 Swim Start', offsetMs: 0, isStart: true },
    ],
  },
  {
    id: 'post_race',
    title: 'Post-Race',
    events: [
      { id: 'finish_watch', label: 'Track expected finish window', offsetMs: 3 * 3600000 },
      { id: 'warm_layers',  label: 'Warm layers + food ready at finish', offsetMs: 3 * 3600000 },
      { id: 'export_data',  label: 'Export swim-crew feed data (JSON)', offsetMs: 3.5 * 3600000 },
    ],
  },
];

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
