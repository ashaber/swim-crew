import CHECKLIST from '../checklist-config.js';

export { CHECKLIST };

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
