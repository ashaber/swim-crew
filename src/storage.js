const LS_ATHLETES = 'swim_crew_athletes';
const LS_FEEDS     = 'swim_crew_feeds';
const LS_START     = 'swim_crew_race_start'; // epoch ms string, manual override
const LS_STOPPED   = 'swim_crew_race_stopped';
const LS_CL        = 'swim_crew_checklist';
const LS_TIMELINE  = 'swim_crew_timeline';
const LS_NOTES     = 'swim_crew_notes';
const LS_ACTIVE    = 'swim_crew_active_athlete';

export const getAthletes  = () => JSON.parse(localStorage.getItem(LS_ATHLETES) || '[]');
export const saveAthletes = a => localStorage.setItem(LS_ATHLETES, JSON.stringify(a));

export const getFeeds  = () => JSON.parse(localStorage.getItem(LS_FEEDS) || '[]');
export const saveFeeds = f => localStorage.setItem(LS_FEEDS, JSON.stringify(f));

export const getRawStart   = () => localStorage.getItem(LS_START);
export const setStartEpoch = ms => localStorage.setItem(LS_START, ms.toString());
export const clearStart    = () => localStorage.removeItem(LS_START);

export const getRaceStopped   = () => localStorage.getItem(LS_STOPPED);
export const setRaceStopped   = () => localStorage.setItem(LS_STOPPED, Date.now().toString());
export const clearRaceStopped = () => localStorage.removeItem(LS_STOPPED);

export const getClState   = () => JSON.parse(localStorage.getItem(LS_CL) || 'null');
export const saveClState  = s => localStorage.setItem(LS_CL, JSON.stringify(s));
export const clearClState = () => localStorage.removeItem(LS_CL);

export const getTimelineState   = () => JSON.parse(localStorage.getItem(LS_TIMELINE) || 'null');
export const saveTimelineState  = s => localStorage.setItem(LS_TIMELINE, JSON.stringify(s));
export const clearTimelineState = () => localStorage.removeItem(LS_TIMELINE);

export const getNotes  = () => localStorage.getItem(LS_NOTES) || '';
export const saveNotes = s => localStorage.setItem(LS_NOTES, s);

export const getActiveAthleteId  = () => localStorage.getItem(LS_ACTIVE);
export const setActiveAthleteId  = id => localStorage.setItem(LS_ACTIVE, id);
