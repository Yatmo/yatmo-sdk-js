// Manual: calls the real Yatmo API with the key in YATMO_LIVE_KEY (skipped otherwise).
//   YATMO_LIVE_KEY=... npx vitest run live
import { describe, expect, it } from 'vitest';
import { createYatmoClient, renderSummaryText } from '../src/index.js';

const KEY = process.env.YATMO_LIVE_KEY;
const brussels = { latitude: 50.8461, longitude: 4.3664 };

describe.skipIf(!KEY)('live API', () => {
  const client = createYatmoClient({ key: KEY ?? 'skipped', country: 'BE', language: 'FR' });

  it('summary, text, scores, enrichment', async () => {
    const summary = await client.summary(brussels);
    expect(summary.categories.length).toBeGreaterThan(0);
    expect(summary.placeInformation?.cityName).toBeTruthy();
    const text = await client.summaryText(brussels);
    expect(text.language).toBe('FR');
    expect(renderSummaryText(text)).toContain('<h3>');
    const scores = await client.scores(brussels);
    expect(scores.scores.length).toBeGreaterThan(0);
    const enrichment = await client.enrichment(brussels);
    expect(enrichment.categories.length).toBeGreaterThan(0);
  }, 60000);

  it('points, categories, isochrones, isochrone, route, geocoding', async () => {
    const groups = await client.simplifiedCategories();
    expect(groups.length).toBeGreaterThan(0);
    const pois = await client.points({ southWest: { latitude: 50.844, longitude: 4.362 }, northEast: { latitude: 50.849, longitude: 4.371 } });
    expect(pois.length).toBeGreaterThan(0);
    const areas = await client.isochrones({ ...brussels, mode: 'walking' });
    expect(areas).toHaveLength(3);
    const area = await client.isochrone({ ...brussels, mode: 'walking', seconds: 600 });
    expect(area.type).toMatch(/Polygon/);
    const route = await client.route({ from: brussels, to: { latitude: 50.8503, longitude: 4.3517 }, mode: 'walking' });
    expect(route.paths[0].distanceMeters).toBeGreaterThan(500);
    const places = await client.geocode('Rue de la Loi 16, 1000 Bruxelles');
    expect(places[0].city).toBeTruthy();
    const near = await client.geocodeNear(brussels, 'Grand Place');
    expect(near.length).toBeGreaterThan(0);
  }, 60000);

  it('static map', async () => {
    const bytes = await client.staticMap({ ...brussels, width: 400, height: 240 });
    expect(bytes.length).toBeGreaterThan(5000);
    expect(bytes[0]).toBe(0xff); // JPEG magic
  }, 60000);
});
