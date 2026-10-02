# Yatmo JavaScript packages

[Yatmo](https://yatmo.com) neighbourhood intelligence for real estate websites, from npm. A Yatmo licence key is
required. [Documentation](https://documentation.yatmo.com).

| Package | Use it for | Runs in |
|---|---|---|
| [`@yatmo/sdk`](packages/sdk) | Typed API client: neighbourhood text (HTML for search engines), summaries, listing enrichment, points of interest, isochrones, routes, geocoding, static maps | Node 18+, browsers, edge (backend key on servers) |
| [`@yatmo/maps`](packages/maps) | The browser plugins: iframe URL builder, JavaScript map, summary table, neighbourhood text loaders | Browsers (frontend key) |
| [`@yatmo/elements`](packages/elements) | `<yatmo-map>`, `<yatmo-pois>`, `<yatmo-text>` web components: one script from a CDN, no framework, no build step | Browsers (frontend key) |
| [`@yatmo/react`](packages/react) | `YatmoMap`, `YatmoPois`, `YatmoNeighbourhoodText` components and hooks; server rendering with data from `@yatmo/sdk` | React 18 and 19 (frontend key in the browser) |
| [`@yatmo/vue`](packages/vue) | The same components and composables for Vue 3 and Nuxt | Vue 3.3+ (frontend key in the browser) |
| [`@yatmo/astro`](packages/astro) | Integration and components for Astro, with a build-time neighbourhood text | Astro 4+ (frontend key in the browser, backend key at build) |
| [`@yatmo/nuxt`](packages/nuxt) | Nuxt module: config, auto-imported components, server-side composables | Nuxt 3.10+ and 4 |
| [`gatsby-plugin-yatmo`](packages/gatsby) | Gatsby plugin: head injection and the React components | Gatsby 4+ |

```bash
npm install @yatmo/sdk        # server side
npm install @yatmo/maps       # browser
npm install @yatmo/elements   # any site (or one <script> from a CDN)
npm install @yatmo/react      # React
npm install @yatmo/vue        # Vue
npm install @yatmo/nuxt       # Nuxt
npm install @yatmo/astro      # Astro
npm install gatsby-plugin-yatmo
```

```ts
import { createYatmoClient, renderSummaryText } from '@yatmo/sdk';
const yatmo = createYatmoClient({ key: process.env.YATMO_KEY, country: 'BE', language: 'FR' });
const html = renderSummaryText(await yatmo.summaryText({ latitude: 50.8461, longitude: 4.3664 }));
```

## Development

```bash
npm install
npm run build       # ESM + CommonJS + types for every package (sdk first, the others depend on it)
npm test            # hermetic tests (fetch is mocked)
YATMO_LIVE_KEY=... npx vitest run live   # against the real API
```

The React Native, iOS, Android and Flutter SDKs have their own repositories: see
[github.com/Yatmo](https://github.com/Yatmo). MIT licence.
