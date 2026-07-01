function uuid() {
  return crypto.randomUUID();
}

export function newAthlete(name, targetDistanceKm) {
  return { id: uuid(), name, targetDistanceKm: targetDistanceKm || null, active: true };
}

export function findAthlete(athletes, id) {
  return athletes.find(a => a.id === id) || null;
}

// Ensures there's a valid active-athlete selection, falling back to the first athlete.
export function resolveActiveId(athletes, requestedId) {
  if (requestedId && findAthlete(athletes, requestedId)) return requestedId;
  return athletes.length ? athletes[0].id : null;
}

export function nextAthleteId(athletes, currentId, direction) {
  if (!athletes.length) return null;
  const idx = athletes.findIndex(a => a.id === currentId);
  const from = idx === -1 ? 0 : idx;
  const next = (from + direction + athletes.length) % athletes.length;
  return athletes[next].id;
}
