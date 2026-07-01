// Pre/post-race timeline. Edit this before race day -- no changes needed
// anywhere else in the app.
//
// `offsetMs` is relative to race start (negative = before start, positive =
// after). Use the MIN/HOUR helpers below for readable offsets instead of
// writing raw millisecond counts, e.g. `-90 * MIN` for "90 minutes before
// start". Exactly one event across all sections should set `isStart: true`
// (marks race start itself, offsetMs: 0) -- the UI highlights it specially.
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export default [
  {
    id: 'pre_race',
    title: 'Pre-Race',
    events: [
      { id: 'arrive',      label: 'Arrive at venue, check in',            offsetMs: -90 * MIN },
      { id: 'crew_brief',  label: 'Brief crew on feed plan (every 30min)', offsetMs: -30 * MIN },
      { id: 'warmup',      label: 'Athlete warmup / water entry',         offsetMs: -15 * MIN },
      { id: 'start',       label: '🏊 Swim Start', offsetMs: 0, isStart: true },
    ],
  },
  {
    id: 'post_race',
    title: 'Post-Race',
    events: [
      { id: 'finish_watch', label: 'Track expected finish window', offsetMs: 3 * HOUR },
      { id: 'warm_layers',  label: 'Warm layers + food ready at finish', offsetMs: 3 * HOUR },
      { id: 'export_data',  label: 'Export swim-crew feed data (JSON)', offsetMs: 3.5 * HOUR },
    ],
  },
];
