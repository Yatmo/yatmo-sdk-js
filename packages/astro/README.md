# @yatmo/astro

Add real estate maps, points of interest and neighbourhood data to Astro sites.
`@yatmo/astro` is the official Astro integration for [Yatmo](https://yatmo.com): an interactive map of the
surroundings of a property (schools, shops, public transport, real travel times on foot, by bike, by car and
by transit, isochrones), the nearest places by category, and a written neighbourhood text rendered **at build
time**, so it sits in the HTML that search engines index. Works with static builds, SSR and content
collections, in 25 countries and 23 languages.

```bash
npm install @yatmo/astro
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import yatmo from '@yatmo/astro';

export default defineConfig({
  integrations: [yatmo({ key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR' })],
});
```

```astro
---
// src/pages/listings/[slug].astro
import { YatmoMap, YatmoPois, YatmoNeighbourhoodText } from '@yatmo/astro/components';
const { latitude, longitude } = listing;
---
<YatmoMap latitude={latitude} longitude={longitude} marker="circle" isochrone="right" height={520} />
<YatmoPois latitude={latitude} longitude={longitude} categories="education,transport,shopping" />
<YatmoNeighbourhoodText latitude={latitude} longitude={longitude} titles="city" />
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Yatmo/yatmo-nextjs-starter/main/docs/screenshot.png" width="720" alt="A property page with the Yatmo map, the nearest places and the neighbourhood text">
</p>

## Install in 5 minutes

1. Get a Yatmo licence at [yatmo.com](https://yatmo.com). It comes with a **frontend** key (locked to your
   domains, used by the map in the browser) and a **backend** key (kept on the build machine, used for the
   neighbourhood text) ([keys explained](https://documentation.yatmo.com/license)).
2. `npm install @yatmo/astro`, add the integration to `astro.config.mjs` with the frontend key, country and
   language.
3. Put `YATMO_KEY=your_backend_key` in `.env`. The build-time text follows the integration's country and language (`YATMO_COUNTRY` and `YATMO_LANGUAGE` in `.env` override them).
4. Drop the components into your listing page with the property coordinates, or its `address` alone.

## Components

| Component | Renders | Where |
|---|---|---|
| `YatmoMap` | The [iframe plugin](https://documentation.yatmo.com/plugins/iframe): map, points of interest, travel times, summary, isochrones, routes. Every plugin parameter is a prop (`mode`, `zoom`, `mapStyle`, `accentColor`, `marker`, `circleRadius`, `rounded`, `isochrone`, `routeFrom`, `height`) | Browser |
| `YatmoPois` | The nearest places by category with distance and travel time (`categories`, `mode`, `limit`, `heading`) | Browser |
| `YatmoText` | The neighbourhood text fetched in the browser (`paragraphs`, `heading`, `titles`) | Browser |
| `YatmoNeighbourhoodText` | The same text, fetched with the backend key during `astro build` (or per request in SSR) and written into the HTML: headings, paragraphs, key places in `<strong>` | Build / server |

All take `latitude` and `longitude`, or `address` (located by Yatmo in the country). `key`, `country` and
`language` override the integration per component. The browser components are the
[`@yatmo/elements`](https://www.npmjs.com/package/@yatmo/elements) web components, loaded once per page by the
integration from a CDN; they render plain HTML your CSS applies to. `YatmoNeighbourhoodText` uses
[`@yatmo/sdk`](https://www.npmjs.com/package/@yatmo/sdk) and logs a warning instead of failing the build when
Yatmo cannot be reached.

## Why

A listing page that describes the neighbourhood, with real travel times to real places, is more useful to the
visitor and brings long-tail search traffic a map alone never brings. Astro builds the text into the page, so
it is indexed like your own content, and the map stays interactive.

## Links

- [Yatmo](https://yatmo.com), [documentation](https://documentation.yatmo.com/api/javascript-sdk)
- Other frameworks: [@yatmo/react](https://www.npmjs.com/package/@yatmo/react), [@yatmo/vue](https://www.npmjs.com/package/@yatmo/vue), [@yatmo/elements](https://www.npmjs.com/package/@yatmo/elements), [Next.js starter](https://github.com/Yatmo/yatmo-nextjs-starter)
- [More examples](https://github.com/Yatmo/yatmo-examples)

MIT licence. Yatmo is a paid service for real estate portals, agency networks and developers; a licence key is required.
