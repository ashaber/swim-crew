# CLAUDE.md — swim-crew

AI working context for this project. Read this before making any changes.

---

## What This Is

A crew-facing feed/pace tracker for ultra open-water swims. Built for Andrew's wife: 10km swims near-term, a 33.3km swim end of year. Crew feeds the athlete roughly every 30 minutes and logs it here; the app can track **two athletes simultaneously** (swipeable) since Andrew may crew two swimmers at once.

**Primary user:** Crew member on shore/boat — phone in hand, needs a fast, low-cognitive-load interface, possibly with weak/no cell service.

**Modeled on:** `ashaber/pit-sync` (sibling repo at `../pit-sync`) — same philosophy: vanilla JS, ES modules, Vite, Vitest, localStorage-only, dark mobile UI, GitHub Pages deploy. Adapted from pit-sync's **lap-triggered** logging to **30-minute-interval-triggered** feed logging, plus multi-athlete support pit-sync doesn't have.

**Garmin Connect IQ / Edge 540 integration is explicitly out of scope for this phase** — separate Monkey C toolchain, future work.

**Live at:** https://ashaber.github.io/swim-crew/ — installable PWA, works fully offline.

---

## Commands

Use these instead of reinventing one-off verification scripts. If a check doesn't exist yet for something you need to verify, add it here (or to `tests/e2e/`) rather than writing a throwaway scratchpad script — ad-hoc verification gets rebuilt from scratch every session; committed scripts don't.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server (hot reload, no service worker — PWA is disabled in dev) |
| `npm run build` | Production build to `dist/` (set `GITHUB_PAGES=true` to build with the `/swim-crew/` base path, as CI does) |
| `npm run preview` | Serve the last `dist/` build (needed to test PWA/service-worker behavior — dev mode doesn't register one) |
| `npm test` | Vitest unit tests (`tests/unit/**/*.test.js`) — pure logic, no browser |
| `npm run test:e2e` | Playwright e2e suite (`tests/e2e/*.spec.js`) — builds, serves, and drives a real headless browser against the production bundle. Runs in CI before every deploy. |
| `npm run lighthouse` | Builds, serves, and audits the production bundle with Lighthouse. Gates on performance/best-practices ≥ 90 (accessibility/SEO are printed but not gated — see script comment for why). Prints the failing element selector on regression instead of requiring manual JSON digging. Not wired into CI (Lighthouse performance scores are noisy on shared CI runners). |

**Adding new e2e coverage:** put it in `tests/e2e/*.spec.js` using `@playwright/test`'s `test`/`expect` — do not add it to `tests/unit/`, Vitest is explicitly scoped away from that directory in `vite.config.js` (`test.include`) because it used to pick up Playwright specs and hang trying to execute them.

**Known sandbox quirk:** this dev environment's kernel string makes `chrome-launcher` misdetect it as WSL, which can create a literal `C:\Users\...` or `\\wsl.localhost\...` directory in the repo root during `npm run lighthouse`. `scripts/lighthouse.mjs` has a defensive cleanup for this built in; if you ever see one anyway, it's safe to delete.

---

## Pre-event configuration

Before a swim, edit these three files directly (no in-app editor by design — long content is impractical to type on a phone; these get set up ahead of time on a computer, then built/deployed):

- **`swim-plan.md`** — feed protocol, pacing table, notes. Rendered into the Plan tab via `marked.js`.
- **`checklist-config.js`** — pre-swim checklist sections/items. Schema and edit notes are commented at the top of the file.
- **`timeline-config.js`** — pre/post-race timeline events, offsets in minutes/hours relative to race start via the `MIN`/`HOUR` helpers (not raw milliseconds). Exactly one event must have `isStart: true`.

`tests/unit/config.test.js` validates both config files' shape (unique ids, exactly one `isStart` event, etc.) — run `npm test` after editing them to catch typos before race day, not during it.

## Bug log

`DEFECTS.md` is the running bug list — check it for open items before starting work, and check items off (with what fixed them and which test covers it) rather than deleting the entry.

---

## Data model

```js
// Athlete
{ id: uuid, name, targetDistanceKm, active }

// Feed (core object, analogous to pit-sync's Lap)
{
  id, athlete_id, intervalNum, timestamp,
  given: { drink: bool, gel: number, water: bool },
  transitionSec,      // 15s increments
  condition,           // 1-5, emoji scale
  location: { method: 'gps'|'manual', lat?, lng?, distanceM? } | null,
  notes,
}
```

localStorage keys: `swim_crew_athletes`, `swim_crew_feeds`, `swim_crew_race_start`, `swim_crew_race_stopped`, `swim_crew_checklist`, `swim_crew_timeline`, `swim_crew_notes`, `swim_crew_active_athlete`.

### Module map

```
src/
  app.js       — DOM layer, event handlers, window bindings for inline onclick
  storage.js   — localStorage read/write
  timer.js     — pure interval/countdown math (getCurrentIntervalNum(feedCount), getMsUntilNextFeed(referenceTime, now))
  athletes.js  — athlete CRUD, swipe/active-athlete resolution
  feeds.js     — haversine distance, calcPace (GPS or manual fallback), calcFeedStats
  checklist.js — checklist logic; data comes from ../checklist-config.js (see Pre-event configuration)
  timeline.js  — timeline resolution logic; data comes from ../timeline-config.js (see Pre-event configuration)
tests/unit/    — Vitest, pure logic only
tests/e2e/     — Playwright, full browser + PWA behavior
scripts/lighthouse.mjs — see Commands above
```

---

## Design Decisions

- **No framework, no backend** — offline-first, low complexity, no reactive-state requirements that justify the overhead.
- **Per-athlete interval/countdown, not a fixed grid** — `timer.js`'s `getCurrentIntervalNum()`/`getMsUntilNextFeed()` take a feed count and a reference time (each athlete's own last feed, or race start if none yet) rather than dividing wall-clock elapsed time by 30 min. An early or late feed shifts that athlete's own next-due time; it doesn't stay pinned to a fixed schedule. Each athlete's schedule is independent of the other's.
- **Two-athlete swipe** — `athletes.js` + `app.js`'s swipe/dot UI; the "+ Add athlete" toggle stays available after the first athlete is added specifically so a second can be added mid-swim.
- **Pace is straight-line, not course-following** — `calcPace()` uses haversine distance between consecutive GPS pins, which undercounts actual swim distance on a non-straight course. Known, accepted approximation.
- **GPS auto-drops on Save** — no separate "Drop GPS Pin" step; tapping Save Feed itself requests the location, with manual-distance as the fallback if GPS fails or is denied.
- **Stopping the swim blocks new entries, not the log** — `#feed-form-container` hides while stopped; feed history/stats/export stay visible.
- **PWA via `vite-plugin-pwa`** — `registerType: 'autoUpdate'`, Workbox `generateSW` mode, no runtime caching needed (no backend calls to cache). Icons are a hand-drawn SVG (`public/icon.svg`) rasterized to the required sizes, not a designer asset — replace when real branding exists.
- **Pre-event config over in-app editing** — Plan/Checklist/Timeline are edited as files before an event (see Pre-event configuration above), not through phone UI, since typing a long plan on a phone mid-swim isn't the workflow — configure ahead of time, then just log during the event.
- **Stopping the swim freezes the clock** — `tickClock()` uses the stop timestamp (not live wall-clock time) as `now` while stopped, so elapsed/countdown displays hold still instead of continuing to tick.
- **Athlete swipe is a real pointer gesture** — `initSwipeGesture()` listens on the stable `#athlete-swipe` container (not the regenerated buttons inside it, which get replaced on every render) so the listener survives re-renders.

## Known Gaps / Deferred

- [ ] Garmin Connect IQ / Edge 540 app — separate toolchain, future phase
- [ ] `swim-plan.md` pacing table is placeholder ("TBD") — fill in once target paces are known
- [ ] No rename/edit UI for an athlete once added (can add and remove, not edit target distance after the fact)
- [ ] Accessibility: color-contrast and the `user-scalable=no` viewport setting were flagged by Lighthouse but left as-is — pre-existing dark-theme/no-pinch-zoom mobile UX choices, not something to change without a product decision
- [ ] CI runs e2e only on push to `main` (i.e., after merge) — no validation workflow runs on the PR itself yet
