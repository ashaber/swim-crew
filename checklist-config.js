// Pre-swim checklist. Edit this before race day -- no changes needed
// anywhere else in the app.
//
// Each section needs a unique `id` and a `title` (shown as a section
// header). Each item needs a unique `id` (used as its localStorage key --
// don't reuse an id across items or their checked-state will collide) and
// `text` (what's shown in the checklist).
export default [
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
