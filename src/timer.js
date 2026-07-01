import { getRawStart } from './storage.js';

export const FEED_INTERVAL_MS = 30 * 60 * 1000;

export function getRaceStart() {
  const s = getRawStart();
  return s ? new Date(parseInt(s)) : null;
}

// 1-indexed: interval 1 is the wait before the first feed, interval 2 the wait
// after the first feed, etc. -- one past however many feeds have been given.
export function getCurrentIntervalNum(feedCount) {
  return feedCount + 1;
}

// ms remaining until the next feed is due, counted from the last feed given
// (or race start if none yet) -- recording a feed restarts this countdown.
export function getMsUntilNextFeed(referenceTime, now = new Date()) {
  if (!referenceTime) return FEED_INTERVAL_MS;
  return FEED_INTERVAL_MS - (now - referenceTime);
}

const pad = n => String(n).padStart(2, '0');

export function formatHMS(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function formatMM(ms) {
  if (ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
