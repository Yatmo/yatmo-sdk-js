# @yatmo/sdk

Typed client for the [Yatmo](https://yatmo.com) API: neighbourhood summaries, points of interest, travel times,
isochrones, geocoding, routes and static maps for real estate websites, in 25 countries. Zero dependency, ESM and
CommonJS, Node 18+, browsers and edge runtimes. [API documentation](https://documentation.yatmo.com/api).

```bash
npm install @yatmo/sdk
```

```ts
import { createYatmoClient, renderSummaryText } from '@yatmo/sdk';

const yatmo = createYatmoClient({ key: process.env.YATMO_KEY!, country: 'BE', language: 'FR' });
const flat = { latitude: 50.8461, longitude: 4.3664 };

// The neighbourhood text, as HTML to write into the property page (indexable by search engines).
const text = await yatmo.summaryText(flat);
const html = renderSummaryText(text);           // <div class="yatmo-text"><h3>Commerces près de la Rue de la Loi</h3><p>...</p>...

// The nearest places by category with travel times.
const summary = await yatmo.summary(flat);
for (const category of summary.categories) {
  for (const sub of category.subCategories) {
    const place = sub.places[0];
    console.log(sub.label, place?.name, place?.travelData.find((t) => t.travelMode === 'walking')?.travelTimeShortLabel);
  }
}
```

## Which key

- On a **server** (Node, Next.js route handlers, serverless), use your **backend** key. This is the normal use of this package.
- In a **browser**, only ever the **frontend** key, the one locked to your domains, and prefer
  [@yatmo/maps](https://www.npmjs.com/package/@yatmo/maps) for what visitors see: the map and the text are rendered by
  the Yatmo plugins. [Keys explained](https://documentation.yatmo.com/license).

## Client

```ts
const yatmo = createYatmoClient({
  key: '...',            // required
  country: 'BE',         // required: the API host is https://be.yatmo.com/
  language: 'FR',        // labels and texts, default EN
  timeoutMs: 15000,      // default
  fetch: customFetch,    // optional, default globalThis.fetch
  headers: {},           // optional extra headers
});
```

| Method | Endpoint | Returns |
|---|---|---|
| `summary(position)` | `/summary` | Places by category with distances and travel times (walking, bicycling, driving, transit), closest cities, reverse-geocoded place |
| `summaryText(position, language?)` | `/Summary/text` | The neighbourhood paragraphs in one language (EN fallback), with `[STRONG]` markers around key places |
| `summaryTextRaw(position)` | `/Summary/text` | The same in every language of the country, to cache (30 days is reasonable) |
| `scores(position)` | `/scores` | One 0 to 10 score per category |
| `enrichment(position)` | `/enrichment` | The nearest place of each category with distances and times, for listing data |
| `points({ southWest, northEast, poiTypeIds? })` | `/points` | Points of interest in a bounding box |
| `simplifiedCategories()` | `/SimplifiedCategories` | Category ids by family, the values of `poiTypeIds` |
| `isochrones({ latitude, longitude, mode })` | `/Isochrone/GetMultipleTimes` | The 5, 10 and 20 minute areas (GeoJSON) |
| `isochrone({ latitude, longitude, mode, seconds })` | `/isochrone` | One area for any duration |
| `route({ from, to, mode })` | `/route` | Distance, duration and LineString of the route |
| `geocode(address)` | `/geolocation` | Addresses to coordinates, inside the country |
| `geocodeNear(position, query)` | `/Geolocation/GetClose` | Address autocomplete around a point |
| `staticMap(options)` | `/image` | JPEG bytes of the map centred on the property (pin colour, size, style, 3D, borders, custom marker) |

`mode` is `walking`, `bicycling`, `driving` or `transit`. Positions are `{ latitude, longitude }`. Every call throws a
`YatmoError` with the HTTP `status` (400 point outside the country, 401 unknown key, 403 country or feature not in
the licence, 429 quota, 0 network).

## Rendering the text

```ts
renderSummaryText(text, {
  format: 'html',            // 'html' (default), 'markdown' or 'plain'
  heading: 'h3',             // h2 to h6, or null for no titles
  titles: 'street-city',     // street name in the first title and city in the second (default), 'city' for discreet listings, 'generic'
  paragraphs: ['education', 'shopping', 'publictransports', 'transports', 'tourism', 'cities'],  // which ones, in this order
  strong: true,              // key places in <strong> or **
  className: 'my-text',      // extra class on the wrapper
});
```

## Example: a Next.js property page

```ts
// app/listings/[id]/page.tsx (server component)
import { createYatmoClient, renderSummaryText } from '@yatmo/sdk';

const yatmo = createYatmoClient({ key: process.env.YATMO_KEY!, country: 'FR', language: 'FR' });

export default async function Listing({ params }) {
  const listing = await getListing(params.id);
  const text = await yatmo.summaryText(listing);          // cache this per listing
  return (
    <article>
      <h1>{listing.title}</h1>
      <section dangerouslySetInnerHTML={{ __html: renderSummaryText(text) }} />
    </article>
  );
}
```

## More

- [Examples](https://github.com/Yatmo/yatmo-examples), [documentation](https://documentation.yatmo.com), [countries and languages](https://documentation.yatmo.com/countries)
- Browser plugins: [@yatmo/maps](https://www.npmjs.com/package/@yatmo/maps). Mobile: [React Native](https://www.npmjs.com/package/@yatmo/react-native), [iOS](https://github.com/Yatmo/yatmo-sdk-ios), [Android](https://github.com/Yatmo/yatmo-sdk-android), [Flutter](https://pub.dev/packages/yatmo_sdk)
- AI assistants: [MCP server](https://github.com/Yatmo/yatmo-mcp)

MIT licence. Yatmo is a paid service; a licence key is required.
