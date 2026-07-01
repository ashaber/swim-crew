export const COND_EMOJI = ['', '😞', '😕', '😐', '🙂', '😊'];

// Haversine distance in meters between two lat/lng points.
export function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Pace in min/100m between two consecutive feeds for the same athlete.
// Prefers GPS-derived distance; falls back to manual distanceM on either feed.
// Returns null if distance or elapsed time can't be determined.
export function calcPace(prevFeed, feed) {
  if (!prevFeed || !feed) return null;
  const elapsedMs = feed.timestamp - prevFeed.timestamp;
  if (elapsedMs <= 0) return null;

  let distanceM = null;
  if (feed.location?.method === 'gps' && prevFeed.location?.method === 'gps') {
    distanceM = haversineMeters(prevFeed.location, feed.location);
  } else if (feed.location?.distanceM != null && prevFeed.location?.distanceM != null) {
    distanceM = feed.location.distanceM - prevFeed.location.distanceM;
  }
  if (distanceM == null || distanceM <= 0) return null;

  const minPer100m = (elapsedMs / 60000) / (distanceM / 100);
  return Math.round(minPer100m * 100) / 100;
}

export function calcFeedStats(feeds, athleteId) {
  const athleteFeeds = feeds.filter(f => f.athlete_id === athleteId).sort((a, b) => a.timestamp - b.timestamp);
  if (!athleteFeeds.length) return null;

  const gels = athleteFeeds.reduce((sum, f) => sum + (f.given?.gel || 0), 0);
  const drinks = athleteFeeds.filter(f => f.given?.drink).length;
  const avgTransitionSec = Math.round(
    athleteFeeds.reduce((s, f) => s + (f.transitionSec || 0), 0) / athleteFeeds.length
  );

  let lastDistanceM = null;
  for (let i = athleteFeeds.length - 1; i >= 0; i--) {
    const loc = athleteFeeds[i].location;
    if (loc?.method === 'manual' && loc.distanceM != null) { lastDistanceM = loc.distanceM; break; }
    if (loc?.method === 'gps') break;
  }

  return { count: athleteFeeds.length, gels, drinks, avgTransitionSec, lastDistanceM };
}

export function exportSwimData(athletes, feeds, notes) {
  return JSON.stringify({
    exported_at: new Date().toISOString(),
    athletes,
    feeds,
    notes,
  }, null, 2);
}
