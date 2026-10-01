// Hermetic tests: fetch is replaced by canned answers, Yatmo is never called.
import { describe, expect, it } from 'vitest';
import { YatmoError, createYatmoClient, renderSummaryText } from '../src/index.js';

const SUMMARY_TEXT_WIRE = {
  Paragraphs: [
    {
      IconId: 'shopping',
      Title: { FR: 'Commerces', EN: 'Shops', NL: 'Winkels' },
      TitleBis: { FR: 'Commerces près de la Rue de la Loi', EN: 'Shops near Rue de la Loi', NL: 'Winkels bij de Wetstraat' },
      TitleTer: { FR: 'Commerces à Bruxelles', EN: 'Shops in Brussels', NL: 'Winkels in Brussel' },
      Sentences: [{ FR: 'Un [STRONG]Carrefour[/STRONG] à 3 minutes.', EN: 'A [STRONG]Carrefour[/STRONG] 3 minutes away.', NL: 'Een [STRONG]Carrefour[/STRONG] op 3 minuten.' }],
      List: [],
    },
    {
      IconId: 'education',
      Title: { FR: 'Écoles', EN: 'Schools', NL: 'Scholen' },
      TitleBis: { FR: 'Écoles près de la Rue de la Loi', EN: 'Schools near Rue de la Loi', NL: 'Scholen bij de Wetstraat' },
      TitleTer: { FR: 'Écoles à Bruxelles', EN: 'Schools in Brussels', NL: 'Scholen in Brussel' },
      Sentences: [{ FR: 'Deux écoles <primaires> à 10 minutes.', EN: 'Two <primary> schools within 10 minutes.', NL: 'Twee scholen.' }],
      List: [{ FR: 'École A', EN: 'School A', NL: 'School A' }],
    },
    { IconId: 'cities', Title: { FR: 'Villes', EN: 'Cities', NL: 'Steden' }, Sentences: [], List: [] },
  ],
};

interface Call { url: string; headers: Record<string, string> }

function fakeFetch(answer: (url: string) => { status?: number; body: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    const { status = 200, body } = answer(url);
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

describe('configuration', () => {
  it('needs a key and a country', () => {
    expect(() => createYatmoClient({ key: '', country: 'BE' })).toThrow(YatmoError);
    expect(() => createYatmoClient({ key: 'k', country: '' as never })).toThrow(YatmoError);
  });

  it('builds country URLs with the language and sends the key header', async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ body: { AvailableCategoriesAroundPosition: [] } }));
    const client = createYatmoClient({ key: 'abc', country: 'FR', language: 'FR', fetch: fetchImpl, headers: { 'X-Test': '1' } });
    await client.summary({ latitude: 48.8566, longitude: 2.3522 });
    expect(calls[0].url).toBe('https://fr.yatmo.com/summary?latitude=48.8566000&longitude=2.3522000&language=FR');
    expect(calls[0].headers.LicenseKey).toBe('abc');
    expect(calls[0].headers['X-Yatmo-SDK']).toMatch(/^yatmo-sdk-js\//);
    expect(calls[0].headers['X-Test']).toBe('1');
  });

  it('accepts a custom base URL', () => {
    const client = createYatmoClient({ key: 'k', country: 'BE', apiBaseUrl: 'http://localhost:5000' });
    expect(client.url('summary', { a: '1' })).toBe('http://localhost:5000/summary?a=1&language=EN');
  });
});

describe('errors', () => {
  it('maps HTTP errors to YatmoError with the API message', async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 403, body: { Error: 'Country not allowed' } }));
    const client = createYatmoClient({ key: 'k', country: 'BE', fetch: fetchImpl });
    await expect(client.scores({ latitude: 50.8, longitude: 4.3 })).rejects.toMatchObject({ name: 'YatmoError', status: 403, message: 'Yatmo API 403: Country not allowed' });
  });

  it('maps network failures to status 0', async () => {
    const client = createYatmoClient({ key: 'k', country: 'BE', fetch: (async () => { throw new Error('offline'); }) as typeof fetch });
    await expect(client.summary({ latitude: 50.8, longitude: 4.3 })).rejects.toMatchObject({ status: 0, message: 'offline' });
  });
});

describe('summary text', () => {
  const { fetchImpl } = fakeFetch(() => ({ body: SUMMARY_TEXT_WIRE }));
  const client = createYatmoClient({ key: 'k', country: 'BE', language: 'FR', fetch: fetchImpl });

  it('resolves the configured language and drops empty paragraphs', async () => {
    const text = await client.summaryText({ latitude: 50.8461, longitude: 4.3664 });
    expect(text.language).toBe('FR');
    expect(text.paragraphs.map((p) => p.iconId)).toEqual(['shopping', 'education']);
    expect(text.paragraphs[0].titleStreet).toBe('Commerces près de la Rue de la Loi');
    expect(text.text).toContain('[STRONG]Carrefour[/STRONG]');
  });

  it('falls back to English for a language the country does not have', async () => {
    const text = await client.summaryText({ latitude: 50.8461, longitude: 4.3664 }, 'DE');
    expect(text.language).toBe('EN');
    expect(text.paragraphs[0].title).toBe('Shops');
  });

  it('keeps every language in the raw form', async () => {
    const raw = await client.summaryTextRaw({ latitude: 50.8461, longitude: 4.3664 });
    expect(raw.languages).toEqual(['FR', 'EN', 'NL']);
    expect(raw.paragraphs[1].items[0].NL).toBe('School A');
  });

  it('renders HTML with street then city titles, escaped text and bold places', async () => {
    const html = renderSummaryText(await client.summaryText({ latitude: 50.8461, longitude: 4.3664 }));
    expect(html).toBe(
      '<div class="yatmo-text">' +
      '<h3>Commerces près de la Rue de la Loi</h3><p>Un <strong>Carrefour</strong> à 3 minutes.</p>' +
      '<h3>Écoles à Bruxelles</h3><p>Deux écoles &lt;primaires&gt; à 10 minutes.</p><ul><li>École A</li></ul>' +
      '</div>',
    );
  });

  it('renders options: paragraph filter, heading, discreet titles, markdown and plain', async () => {
    const text = await client.summaryText({ latitude: 50.8461, longitude: 4.3664 });
    expect(renderSummaryText(text, { paragraphs: ['education'], heading: 'h2', titles: 'city', className: 'mine' }))
      .toBe('<div class="yatmo-text mine"><h2>Écoles à Bruxelles</h2><p>Deux écoles &lt;primaires&gt; à 10 minutes.</p><ul><li>École A</li></ul></div>');
    expect(renderSummaryText(text, { format: 'markdown', titles: 'generic' }))
      .toBe('### Commerces\n\nUn **Carrefour** à 3 minutes.\n\n### Écoles\n\nDeux écoles <primaires> à 10 minutes.\n- École A');
    expect(renderSummaryText(text, { format: 'plain', strong: false }))
      .toBe('Commerces près de la Rue de la Loi\nUn Carrefour à 3 minutes.\n\nÉcoles à Bruxelles\nDeux écoles <primaires> à 10 minutes.\n- École A');
  });
});

describe('other endpoints', () => {
  it('maps points, isochrones, routes and places', async () => {
    const { fetchImpl, calls } = fakeFetch((url) => {
      if (url.includes('/points?')) return { body: [{ n: 'Bus', t: 'Bus stop', la: 50.84, ln: 4.35, p: '1003', i: '35,36', si: '', g: true }] };
      if (url.includes('/Isochrone/GetMultipleTimes')) return { body: [{ label: '5', iso: { type: 'Polygon', coordinates: [] } }] };
      if (url.includes('/route?')) return { body: { paths: [{ distance: 1234.5, time: 456000, points: { type: 'LineString', coordinates: [[4.3, 50.8]] } }], info: {} } };
      if (url.includes('/geolocation?')) return { body: { features: [{ geometry: { coordinates: [4.3677, 50.84367] }, properties: { street: 'Rue de la Loi', housenumber: '16', postcode: '1000', city: 'Brussels' } }, { geometry: null }] } };
      if (url.includes('/SimplifiedCategories')) return { body: { Transports: [2, 1], Education: [3] } };
      return { status: 404, body: 'no' };
    });
    const client = createYatmoClient({ key: 'k', country: 'BE', fetch: fetchImpl });

    const pois = await client.points({ southWest: { latitude: 50.84, longitude: 4.34 }, northEast: { latitude: 50.85, longitude: 4.36 }, poiTypeIds: [1003] });
    expect(calls[0].url).toContain('bound1=50.8400000%2C4.3400000&bound2=50.8500000%2C4.3600000&groupSamePositions=true&caringForBigResponse=true&poiTypesIds=1003');
    expect(pois[0]).toMatchObject({ name: 'Bus', categoryId: '1003', iconIds: ['35', '36'], grouped: true });

    const isochrones = await client.isochrones({ latitude: 50.84, longitude: 4.35, mode: 'bicycling' });
    expect(calls[1].url).toContain('travelMode=Bicycling');
    expect(isochrones[0].geometry.type).toBe('Polygon');

    const route = await client.route({ from: { latitude: 50.84, longitude: 4.35 }, to: { latitude: 50.86, longitude: 4.36 }, mode: 'driving' });
    expect(calls[2].url).toContain('travelMode=Driving&startLatitude=50.8400000&startLongitude=4.3500000&arrivalLatitude=50.8600000&arrivalLongitude=4.3600000');
    expect(route.paths[0]).toMatchObject({ distanceMeters: 1234.5, durationSeconds: 456 });

    const places = await client.geocode(' Rue de la Loi 16, Bruxelles ');
    expect(calls[3].url).toContain('geolocation?address=Rue%20de%20la%20Loi%2016%2C%20Bruxelles');
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ latitude: 50.84367, longitude: 4.3677, label: 'Rue de la Loi 16, 1000 Brussels' });

    const groups = await client.simplifiedCategories();
    expect(groups).toEqual([{ name: 'Education', poiTypeIds: [3] }, { name: 'Transports', poiTypeIds: [2, 1] }]);
  });

  it('builds the static map URL', () => {
    const client = createYatmoClient({ key: 'k', country: 'BE' });
    expect(client.staticMapUrl({ latitude: 50.8, longitude: 4.3, color: '#06A7EA', width: 600, height: 300, mapStyle: 'dark', bigIcons: true }))
      .toBe('https://be.yatmo.com/image?latitude=50.8000000&longitude=4.3000000&hexaColor=06A7EA&width=600&height=300&mapStyle=6&bigIcon=true&language=EN');
  });
});
