export const CHECKLIST = [
  { id: 'feed_station', title: 'Feed Station Setup', items: [
    { id: 'fs1', text: 'Feed pole / hand-up rig ready' },
    { id: 'fs2', text: 'Sport drink mixed and bottled' },
    { id: 'fs3', text: 'Gels sorted and accessible' },
    { id: 'fs4', text: 'Water bottles staged' },
    { id: 'fs5', text: 'Feed log (this app) — phone charged' },
  ]},
  { id: 'boat_shore', title: 'Boat / Shore Support', items: [
    { id: 'bs1', text: 'Kayak or support boat confirmed' },
    { id: 'bs2', text: 'Phone in waterproof case' },
    { id: 'bs3', text: 'Sunscreen, hat, water for crew' },
    { id: 'bs4', text: 'Course map / turn buoys reviewed' },
  ]},
  { id: 'athlete_gear', title: "Athlete's Gear", items: [
    { id: 'ag1', text: 'Wetsuit / swimskin' },
    { id: 'ag2', text: 'Goggles (spare pair packed)' },
    { id: 'ag3', text: 'Swim cap(s)' },
    { id: 'ag4', text: 'Anti-chafe / Body Glide applied' },
    { id: 'ag5', text: 'Post-swim warm layers staged' },
  ]},
  { id: 'race_day', title: 'Race Day', items: [
    { id: 'rd1', text: 'Arrive, check in, confirm start time' },
    { id: 'rd2', text: 'Review feed plan with crew (every 30 min)' },
    { id: 'rd3', text: 'Confirm GPS/tracking on before start' },
    { id: 'rd4', text: 'Start swim-crew timer at gun' },
  ]},
];

export function buildDefaultClState(checklist) {
  const state = {};
  checklist.forEach(s => s.items.forEach(item => { state[item.id] = item.def === true; }));
  return state;
}

export function countChecklist(checklist, state) {
  let total = 0, done = 0;
  checklist.forEach(s => s.items.forEach(item => { total++; if (state[item.id]) done++; }));
  return { total, done };
}
