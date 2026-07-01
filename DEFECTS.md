# Defects

Bug log for swim-crew. Address opportunistically; check items off when fixed.

---

1. ~~**D1** — Stop button doesn't stop the timer: after tapping Stop, the countdown/elapsed clock keeps ticking down instead of freezing. (`src/app.js` `stopSwim()` / `tickClock()`)~~ Fixed: `tickClock()` now pins `now` to the stop timestamp instead of live wall-clock time while stopped. Covered by `tests/e2e/gps-and-stop.spec.js`.
2. ~~**D2** — Swipe gesture between swimmers doesn't work; only the arrow buttons switch the active athlete. (athlete swipe UI)~~ Fixed: added a real pointer-based swipe gesture on `#athlete-swipe` (`initSwipeGesture()` in `src/app.js`). Covered by `tests/e2e/multi-athlete.spec.js`.
