import {
  getAthletes, saveAthletes,
  getFeeds, saveFeeds,
  getRawStart, setStartEpoch, clearStart,
  getRaceStopped, setRaceStopped, clearRaceStopped,
  getClState, saveClState, clearClState,
  getTimelineState, saveTimelineState,
  getNotes, saveNotes,
  getActiveAthleteId, setActiveAthleteId,
} from './storage.js';
import {
  FEED_INTERVAL_MS, getRaceStart, getCurrentIntervalNum, getMsUntilNextFeed,
  formatHMS, formatHM, formatMM,
} from './timer.js';
import { newAthlete, findAthlete, resolveActiveId, nextAthleteId } from './athletes.js';
import { COND_EMOJI, calcPace, calcFeedStats, exportSwimData } from './feeds.js';
import { CHECKLIST, buildDefaultClState, countChecklist } from './checklist.js';
import { TIMELINE_TEMPLATE, buildDefaultTlState, resolveTimeline, findNextEvent } from './timeline.js';
import { marked } from 'marked';
import swimPlanMd from '../swim-plan.md?raw';

let athletes   = getAthletes();
let feeds      = getFeeds();
let clState    = getClState();
let tlState    = getTimelineState();
let activeId   = resolveActiveId(athletes, getActiveAthleteId());
let gel        = 0;
let transitionSec = 0;
let condition  = null;
let location_  = null; // { method: 'gps'|'manual', lat, lng, distanceM }
let addAthleteFormOpen = false;

// ── Athletes ─────────────────────────────────────────────────────────────────

function toggleAddAthleteForm() {
  addAthleteFormOpen = !addAthleteFormOpen;
  renderFeedTab();
}

function addAthlete() {
  const name = document.getElementById('new-athlete-name').value.trim();
  if (!name) return;
  const km   = parseFloat(document.getElementById('new-athlete-km').value) || null;
  const a    = newAthlete(name, km);
  athletes.push(a);
  saveAthletes(athletes);
  activeId = a.id;
  setActiveAthleteId(activeId);
  document.getElementById('new-athlete-name').value = '';
  document.getElementById('new-athlete-km').value = '';
  addAthleteFormOpen = false;
  renderFeedTab();
}

function removeAthlete(id) {
  if (!confirm('Remove this athlete? Their feed history is kept but no longer shown here.')) return;
  athletes = athletes.filter(a => a.id !== id);
  saveAthletes(athletes);
  activeId = resolveActiveId(athletes, null);
  setActiveAthleteId(activeId || '');
  renderFeedTab();
}

function swipeAthlete(direction) {
  const next = nextAthleteId(athletes, activeId, direction);
  if (!next) return;
  activeId = next;
  setActiveAthleteId(activeId);
  resetFeedForm();
  renderFeedTab();
}

function selectAthleteDot(id) {
  activeId = id;
  setActiveAthleteId(activeId);
  resetFeedForm();
  renderFeedTab();
}

// ── Race timer ───────────────────────────────────────────────────────────────

function startSwim() {
  setStartEpoch(Date.now());
  renderFeedTab();
}

function stopSwim() {
  if (!confirm('Stop the swim? Feed entry will be blocked until resumed.')) return;
  setRaceStopped();
  renderFeedTab();
}

function resumeSwim() {
  clearRaceStopped();
  renderFeedTab();
}

function resetSwim() {
  if (!confirm('Reset timer? Feed data is kept.')) return;
  clearStart();
  clearRaceStopped();
  renderFeedTab();
}

function clearAllData() {
  if (!confirm('Clear ALL data? This removes all feeds, athletes, and resets the timer.')) return;
  athletes = [];
  feeds = [];
  saveAthletes(athletes);
  saveFeeds(feeds);
  clearStart();
  clearRaceStopped();
  activeId = null;
  renderFeedTab();
}

// Reference point for the next-feed countdown: the active athlete's own last
// feed, or race start if they haven't been fed yet.
function getFeedReferenceTime(athleteId) {
  const start = getRaceStart();
  if (!athleteId) return start;
  const athleteFeeds = feeds.filter(f => f.athlete_id === athleteId);
  if (!athleteFeeds.length) return start;
  const last = athleteFeeds.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  return new Date(last.timestamp);
}

function getFeedCount(athleteId) {
  if (!athleteId) return 0;
  return feeds.filter(f => f.athlete_id === athleteId).length;
}

function tickClock() {
  const now   = new Date();
  const start = getRaceStart();
  const elEl  = document.getElementById('elapsed-display');
  const nextEl = document.getElementById('next-feed-display');
  const intEl  = document.getElementById('interval-display');

  if (!start) {
    if (elEl) elEl.textContent = '—';
    if (nextEl) nextEl.textContent = '—';
    if (intEl) intEl.textContent = '—';
    return;
  }

  elEl.textContent = formatHMS(now - start);
  intEl.textContent = `#${getCurrentIntervalNum(getFeedCount(activeId))}`;
  const msLeft = getMsUntilNextFeed(getFeedReferenceTime(activeId), now);
  nextEl.textContent = formatMM(msLeft);
  nextEl.className = 'clock-value ' + (msLeft < 2 * 60000 ? 'cv-red' : 'cv-accent');
}

function renderTimerUI() {
  const start   = !!getRawStart();
  const stopped = !!getRaceStopped();
  const racing  = start && !stopped;
  document.getElementById('prestart-ui').classList.toggle('hidden', start);
  document.getElementById('stopped-ui').classList.toggle('hidden', !stopped);
  document.getElementById('stop-swim-btn').classList.toggle('hidden', !racing);
  document.getElementById('feed-area').classList.toggle('hidden', !start || !athletes.length);
  document.getElementById('feed-form-container').classList.toggle('hidden', !racing);
  document.getElementById('feed-paused-msg').classList.toggle('hidden', racing);
}

// ── Feed form ────────────────────────────────────────────────────────────────

function resetFeedForm() {
  gel = 0;
  transitionSec = 0;
  condition = null;
  location_ = null;
  document.querySelectorAll('.check-opt').forEach(b => b.classList.remove('checked'));
  document.querySelectorAll('.cond-btn').forEach(b => b.classList.remove('selected'));
  const notesEl = document.getElementById('feed-notes');
  if (notesEl) notesEl.value = '';
  const manualEl = document.getElementById('manual-distance');
  if (manualEl) manualEl.value = '';
  const gpsStatus = document.getElementById('gps-status');
  if (gpsStatus) gpsStatus.textContent = '📍 GPS pin drops automatically on save';
  updateGelDisplay();
  updateTransitionDisplay();
}

function toggleCheck(el) { el.classList.toggle('checked'); }

function adjustGel(delta) {
  gel = Math.max(0, Math.min(6, gel + delta));
  updateGelDisplay();
}
function updateGelDisplay() {
  const el = document.getElementById('gel-count');
  if (el) el.textContent = gel;
}

function adjustTransition(deltaSec) {
  transitionSec = Math.max(0, Math.min(600, transitionSec + deltaSec));
  updateTransitionDisplay();
}
function updateTransitionDisplay() {
  const el = document.getElementById('transition-display');
  if (el) el.textContent = `${transitionSec}s`;
}

function selectCondition(btn) {
  const isSelected = btn.classList.contains('selected');
  document.querySelectorAll('.cond-btn').forEach(b => b.classList.remove('selected'));
  if (!isSelected) { btn.classList.add('selected'); condition = Number(btn.dataset.val); }
  else condition = null;
}

function getGpsPin() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve({ error: 'GPS not available on this device.' }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ pos }),
      err => resolve({ error: err.message }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

async function saveFeed() {
  if (!activeId) return;
  const now = new Date();
  const drink = document.querySelector('.check-opt[data-id="drink"]').classList.contains('checked');
  const water = document.querySelector('.check-opt[data-id="water"]').classList.contains('checked');
  const notes = document.getElementById('feed-notes').value.trim();
  const manualDistance = parseFloat(document.getElementById('manual-distance').value);

  const statusEl = document.getElementById('gps-status');
  const saveBtn  = document.querySelector('.btn-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  statusEl.textContent = 'Dropping GPS pin…';

  const { pos, error } = await getGpsPin();
  let loc = null;
  let resultMsg;
  if (pos) {
    loc = { method: 'gps', lat: pos.coords.latitude, lng: pos.coords.longitude };
    resultMsg = `Pin dropped ✓ (±${Math.round(pos.coords.accuracy)}m accuracy)`;
  } else if (!isNaN(manualDistance)) {
    loc = { method: 'manual', distanceM: manualDistance };
    resultMsg = 'Saved using manual distance.';
  } else {
    resultMsg = `GPS failed (${error}). Saved without location.`;
  }

  feeds.push({
    id: crypto.randomUUID(),
    athlete_id: activeId,
    intervalNum: getCurrentIntervalNum(getFeedCount(activeId)),
    timestamp: now.getTime(),
    given: { drink, gel, water },
    transitionSec,
    condition,
    location: loc,
    notes,
  });

  saveFeeds(feeds);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Feed';
  resetFeedForm();
  statusEl.textContent = resultMsg;
  renderFeedHistory();
  tickClock();
}

function deleteFeed(id) {
  if (!confirm('Delete this feed entry?')) return;
  feeds = feeds.filter(f => f.id !== id);
  saveFeeds(feeds);
  renderFeedHistory();
  tickClock();
}

// ── Feed tab render ──────────────────────────────────────────────────────────

function renderAthleteSwipe() {
  const el = document.getElementById('athlete-swipe');
  if (!el) return;
  if (!athletes.length) { el.innerHTML = ''; return; }
  const active = findAthlete(athletes, activeId);
  let html = `<div class="swipe-row">
    <button class="swipe-arrow" onclick="swipeAthlete(-1)" ${athletes.length < 2 ? 'disabled' : ''}>‹</button>
    <div class="swipe-name">${active ? active.name : ''}${active?.targetDistanceKm ? ` <span class="swipe-target">(${active.targetDistanceKm}km)</span>` : ''}</div>
    <button class="swipe-arrow" onclick="swipeAthlete(1)" ${athletes.length < 2 ? 'disabled' : ''}>›</button>
  </div>`;
  if (athletes.length > 1) {
    html += `<div class="swipe-dots">`;
    athletes.forEach(a => {
      html += `<div class="swipe-dot ${a.id === activeId ? 'active' : ''}" onclick="selectAthleteDot('${a.id}')"></div>`;
    });
    html += `</div>`;
  }
  el.innerHTML = html;
}

function renderFeedHistory() {
  const container = document.getElementById('feed-history');
  const statsEl    = document.getElementById('feed-stats');
  if (!container) return;

  if (!activeId) { container.innerHTML = ''; if (statsEl) statsEl.classList.add('hidden'); return; }

  const athleteFeeds = feeds.filter(f => f.athlete_id === activeId).sort((a, b) => b.timestamp - a.timestamp);
  if (!athleteFeeds.length) {
    container.innerHTML = '<div class="no-feeds">No feeds logged yet.</div>';
    if (statsEl) statsEl.classList.add('hidden');
    return;
  }

  const stats = calcFeedStats(feeds, activeId);
  if (statsEl && stats) {
    statsEl.classList.remove('hidden');
    document.getElementById('stat-feeds').textContent = stats.count;
    document.getElementById('stat-gels').textContent = stats.gels;
    document.getElementById('stat-transition').textContent = `${stats.avgTransitionSec}s`;
  }

  const sortedAsc = [...athleteFeeds].reverse();
  let html = '<div class="feed-history-title">Feed History</div>';
  [...athleteFeeds].forEach(feed => {
    const idx = sortedAsc.findIndex(f => f.id === feed.id);
    const prev = idx > 0 ? sortedAsc[idx - 1] : null;
    const pace = calcPace(prev, feed);
    const givenStr = [
      feed.given?.drink ? 'Drink' : null,
      feed.given?.gel ? `Gel×${feed.given.gel}` : null,
      feed.given?.water ? 'Water' : null,
    ].filter(Boolean).join(', ') || '—';
    const condStr = feed.condition ? COND_EMOJI[feed.condition] : '';
    const timeStr = new Date(feed.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    html += `<div class="feed-row">
      <div class="feed-num">#${feed.intervalNum}</div>
      <div class="feed-details">
        <div class="feed-time-row">
          <div class="feed-time">${timeStr}</div>
          ${condStr ? `<div class="feed-cond">${condStr}</div>` : ''}
          ${pace != null ? `<div class="feed-pace">${pace} min/100m</div>` : ''}
        </div>
        <div class="feed-meta">Given: ${givenStr}</div>
        <div class="feed-meta">Transition: ${feed.transitionSec}s</div>
        ${feed.notes ? `<div class="feed-notes-text">${feed.notes}</div>` : ''}
      </div>
      <button class="feed-delete" onclick="deleteFeed('${feed.id}')">✕</button>
    </div>`;
  });
  container.innerHTML = html;
}

function renderFeedTab() {
  const noAthletes = document.getElementById('no-athletes-ui');
  if (noAthletes) noAthletes.classList.toggle('hidden', athletes.length > 0 && !addAthleteFormOpen);
  const toggleBtn = document.getElementById('add-athlete-toggle-btn');
  if (toggleBtn) {
    toggleBtn.classList.toggle('hidden', athletes.length === 0);
    toggleBtn.textContent = addAthleteFormOpen ? '✕ Cancel' : '+ Add athlete';
  }
  renderTimerUI();
  renderAthleteSwipe();
  renderFeedHistory();
  tickClock();
}

// ── Checklist ────────────────────────────────────────────────────────────────

function initClState() {
  if (clState) return;
  clState = buildDefaultClState(CHECKLIST);
  saveClState(clState);
}

function toggleClItem(id) {
  clState[id] = !clState[id];
  saveClState(clState);
  renderChecklist();
}

function resetChecklist() {
  if (!confirm('Reset all checklist items to defaults?')) return;
  clState = null;
  clearClState();
  initClState();
  renderChecklist();
}

function renderChecklist() {
  const body = document.getElementById('checklist-body');
  const { total, done } = countChecklist(CHECKLIST, clState);
  let html = '';
  CHECKLIST.forEach(section => {
    const unchecked = section.items.filter(item => !clState[item.id]);
    const checked   = section.items.filter(item =>  clState[item.id]);
    html += `<div class="checklist-section"><div class="section-header">${section.title}</div>`;
    unchecked.forEach(item => {
      html += `<div class="checklist-item" onclick="toggleClItem('${item.id}')">
        <div class="cl-check"></div><div class="cl-text">${item.text}</div></div>`;
    });
    if (checked.length) {
      if (unchecked.length) html += `<div class="cl-done-divider">Completed</div>`;
      checked.forEach(item => {
        html += `<div class="checklist-item done" onclick="toggleClItem('${item.id}')">
          <div class="cl-check"></div><div class="cl-text">${item.text}</div></div>`;
      });
    }
    html += `</div>`;
  });
  body.innerHTML = html;
  document.getElementById('cl-done').textContent  = done;
  document.getElementById('cl-total').textContent = total;
}

// ── Timeline ─────────────────────────────────────────────────────────────────

function initTlState() {
  if (tlState) return;
  tlState = buildDefaultTlState();
  saveTimelineState(tlState);
}

function toggleTlItem(id) {
  tlState[id] = !tlState[id];
  saveTimelineState(tlState);
  renderTimeline();
}

function renderTimeline() {
  const body = document.getElementById('timeline-body');
  const resolved = resolveTimeline(getRaceStart());
  let html = '';
  resolved.forEach(section => {
    html += `<div class="tl-section"><div class="tl-section-title">${section.title}</div>`;
    section.events.forEach(event => {
      const done = !!tlState[event.id];
      const cls = ['tl-item', done ? 'done' : '', event.isStart ? 'race-start' : ''].filter(Boolean).join(' ');
      html += `<div class="${cls}" id="tl-${event.id}" onclick="toggleTlItem('${event.id}')">
        <div class="tl-check">${done ? '✓' : ''}</div>
        <div class="tl-content"><div class="tl-label">${event.label}</div><div class="tl-time">${event.display}</div></div>
      </div>`;
    });
    html += `</div>`;
  });
  body.innerHTML = html;
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'timeline') {
    const resolved = resolveTimeline(getRaceStart());
    const nextId = findNextEvent(resolved, new Date());
    if (nextId) {
      const el = document.getElementById(`tl-${nextId}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  }
}

// ── Export ───────────────────────────────────────────────────────────────────

function exportData() {
  const json = exportSwimData(athletes, feeds, getNotes());
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'swim_crew_export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Markdown render ──────────────────────────────────────────────────────────

function renderMarkdown(md, el) {
  el.innerHTML = marked.parse(md);
  el.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
}

// ── Expose globals for inline onclick handlers ────────────────────────────────

Object.assign(window, {
  showTab,
  addAthlete, removeAthlete, swipeAthlete, selectAthleteDot, toggleAddAthleteForm,
  startSwim, stopSwim, resumeSwim, resetSwim, clearAllData,
  toggleCheck, adjustGel, adjustTransition, selectCondition,
  saveFeed, deleteFeed,
  toggleClItem, resetChecklist,
  toggleTlItem,
  exportData,
});

// ── Init ─────────────────────────────────────────────────────────────────────

initClState();
renderChecklist();
initTlState();
renderTimeline();
renderFeedTab();
resetFeedForm();
setInterval(tickClock, 1000);
tickClock();

renderMarkdown(swimPlanMd, document.getElementById('plan-content'));

document.getElementById('swim-notes').value = getNotes();
document.getElementById('swim-notes').addEventListener('input', e => saveNotes(e.target.value));
