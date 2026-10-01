# Yatmo JavaScript packages

[Yatmo](https://yatmo.com) neighbourhood intelligence for real estate websites, from npm. A Yatmo licence key is
required. [Documentation](https://documentation.yatmo.com).

| Package | Use it for | Runs in |
|---|---|---|
| [`@yatmo/sdk`](packages/sdk) | Typed API client: neighbourhood text (HTML for search engines), summaries, listing enrichment, points of interest, isochrones, routes, geocoding, static maps | Node 18+, browsers, edge (backend key on servers) |
| [`@yatmo/maps`](packages/maps) | The browser plugins: iframe URL builder, JavaScript map, summary table, neighbourhood text loaders | Browsers (frontend key) |

```bash
npm install @yatmo/sdk      # server side
npm install @yatmo/maps     # browser
```

```ts
import { createYatmoClient, renderSummaryText } from '@yatmo/sdk';
const yatmo = createYatmoClient({ key: process.env.YATMO_KEY, country: 'BE', language: 'FR' });
const html = renderSummaryText(await yatmo.summaryText({ latitude: 50.8461, longitude: 4.3664 }));
```

## Development

```bash
npm install
npm run build       # ESM + CommonJS + types for both packages
npm test            # hermetic tests (fetch is mocked)
YATMO_LIVE_KEY=... npx vitest run live   # against the real API
```

The React Native, iOS, Android and Flutter SDKs have their own repositories: see
[github.com/Yatmo](https://github.com/Yatmo). MIT licence.
