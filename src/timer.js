import { getRawStart } from './storage.js';

export const FEED_INTERVAL_MS = 30 * 60 * 1000;

export function getRaceStart() {
  const s = getRawStart();
  return s ? new Date(parseInt(s)) : null;
}

export function getElapsedMs(now = new Date()) {
  const start = getRaceStart();
  if (!start || now < start) return 0;
  return now - start;
}

// 1-indexed: interval 1 covers [0, 30min), interval 2 covers [30min, 60min), ...
export function getCurrentIntervalNum(now = new Date()) {
  return Math.floor(getElapsedMs(now) / FEED_INTERVAL_MS) + 1;
}

export function getMsUntilNextFeed(now = new Date()) {
  const elapsed = getElapsedMs(now);
  const intoInterval = elapsed % FEED_INTERVAL_MS;
  return FEED_INTERVAL_MS - intoInterval;
}

const pad = n => String(n).padStart(2, '0');

export function formatHMS(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function formatHM(ms) {
  if (ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}`;
}

export function formatMM(ms) {
  if (ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
