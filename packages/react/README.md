# @yatmo/react

Add real estate maps, points of interest and neighbourhood data to React applications.
`@yatmo/react` is the official React SDK for [Yatmo](https://yatmo.com), providing ready-to-use components for
property maps, nearby schools, nurseries, supermarkets and public transport with real travel times, and written
neighbourhood insights, in 25 countries and 23 languages. Works with Next.js, Remix and Vite, server rendering included.

```bash
npm install @yatmo/react
```

```tsx
import { YatmoMap, YatmoPois, YatmoNeighbourhoodText } from '@yatmo/react';

const yatmo = { key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR', latitude: 50.8461, longitude: 4.3664 };

export function Listing() {
  return (
    <>
      <YatmoMap licenseKey={yatmo.key} country="BE" language="FR" latitude={50.8461} longitude={4.3664} marker="circle" isochrone="right" />
      <YatmoPois client={yatmo} categories={['education', 'shopping']} />
      <YatmoNeighbourhoodText client={yatmo} />
    </>
  );
}
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Yatmo/.github/main/profile/img/map-and-summary.png" width="720" alt="Yatmo neighbourhood map with points of interest and travel times on a property page">
</p>

## Install in 5 minutes

1. Get a Yatmo licence key at [yatmo.com](https://yatmo.com). In the browser, use the **frontend** key (locked to
   your domains); on the server, the **backend** key ([keys explained](https://documentation.yatmo.com/license)).
2. `npm install @yatmo/react` (React 18 or 19).
3. Put `<YatmoMap>` on the property page with the coordinates; add `<YatmoPois>` and `<YatmoNeighbourhoodText>`.

Runnable demo (Vite, a complete listing page): [yatmo-examples/09-react](https://github.com/Yatmo/yatmo-examples/tree/main/09-react).

## Components

### `<YatmoMap>`

The interactive neighbourhood map as the Yatmo iframe plugin: points of interest with travel times on foot, by bike,
by car and by public transport, summary, isochrones, routes. Renders on the server too (it is one `<iframe>`), and
several maps can share a page. Props are the [iframe plugin parameters](https://documentation.yatmo.com/plugins/iframe):
`licenseKey`, `country`, `language`, `latitude`, `longitude`, `mode`, `zoom`, `mapStyle`, `accentColor`, `marker`,
`circleRadiusInMeters`, `customMarker`, `rounded`, `isochrone`, `routeFrom`, `userId`, `height`, `title`, `className`, `style`.

### `<YatmoInteractiveMap>`

The Yatmo JavaScript map plugin, when the map must blend into the page or expose the search features (travel-time
search, listings on the map). `config` is the plugin's `yatmoConfig` without `container`. One per page.

```tsx
<YatmoInteractiveMap config={{ licenseKey: KEY, country: 'BE', language: 'FR', center: [4.3664, 50.8461], zoom: 16, fullScreenButton: true }} />
```

### `<YatmoPois>`

The nearest places by category with distance and travel time, as headings and lists styled by your CSS.
Props: `categories` (`education`, `transport`, `shopping`, `tourism`), `mode` (`walking` default, `bicycling`,
`driving`, `transit`), `limit` per sub-category, `heading`, `renderPlace(place, { distance, time })`, `fallback`, `renderError`.

### `<YatmoNeighbourhoodText>`

The written description of the neighbourhood: headings and paragraphs, key places in `<strong>`.
Props: `heading` (`h2` to `h6` or `null`), `titles` (`street-city`, `city` for discreet listings, `generic`),
`paragraphs` (`education`, `shopping`, `publictransports`, `transports`, `tourism`, `cities`), `strong`, `className`,
`fallback`, `renderError`.

### Server rendering, for search engines

`YatmoPois` and `YatmoNeighbourhoodText` take their data either from `client` (fetched in the browser with the
frontend key) or from `summary` / `text` fetched on the server with [@yatmo/sdk](https://www.npmjs.com/package/@yatmo/sdk).
The second form renders the text into the HTML, so search engines and AI assistants index it:

```tsx
// app/listings/[id]/page.tsx (Next.js server component)
import { createYatmoClient } from '@yatmo/sdk';
import { YatmoMap, YatmoNeighbourhoodText, YatmoPois } from '@yatmo/react';

const yatmo = createYatmoClient({ key: process.env.YATMO_KEY!, country: 'FR', language: 'FR' });

export default async function Listing({ params }) {
  const listing = await getListing(params.id);
  const [text, summary] = await Promise.all([yatmo.summaryText(listing), yatmo.summary(listing)]);  // cache per listing
  return (
    <article>
      <h1>{listing.title}</h1>
      <YatmoMap licenseKey={process.env.NEXT_PUBLIC_YATMO_FRONTEND_KEY!} country="FR" language="FR" latitude={listing.latitude} longitude={listing.longitude} />
      <YatmoPois summary={summary} categories={['education', 'transport']} />
      <YatmoNeighbourhoodText text={text} />
    </article>
  );
}
```

### Hooks

`useYatmoClient(config)`, `useYatmoSummary(client, position)` and `useYatmoText(client, position, language?)`
return `{ data, loading, error }` for your own markup.

## More

[Examples](https://github.com/Yatmo/yatmo-examples) · [Documentation](https://documentation.yatmo.com) ·
[Web components for any site](https://www.npmjs.com/package/@yatmo/elements) · [React Native](https://www.npmjs.com/package/@yatmo/react-native)

MIT licence. Yatmo is a paid service for real estate portals, agency networks and developers; a licence key is required.
