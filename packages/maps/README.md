# @yatmo/maps

The [Yatmo](https://yatmo.com) browser plugins for real estate websites, from npm: a typed builder for the iframe
plugin, and loaders for the JavaScript map, the summary table and the neighbourhood text. The plugins themselves are
served by Yatmo (`map.yatmo.com`), so this package stays tiny and always runs the current version.
[Plugin documentation](https://documentation.yatmo.com/plugins).

```bash
npm install @yatmo/maps
```

Uses your **frontend** key, the one locked to your domains ([keys explained](https://documentation.yatmo.com/license)).
For server-side calls (neighbourhood text indexable by search engines, listing enrichment), see
[@yatmo/sdk](https://www.npmjs.com/package/@yatmo/sdk).

## Iframe: the smallest integration

```ts
import { mountIframe, iframeUrl } from '@yatmo/maps';

mountIframe('neighbourhood', {
  key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR',
  latitude: 50.8461, longitude: 4.3664,
  mode: 'overlay',          // overlay, overlay-scores, map-top, map, summary, summary-tabs
  marker: 'circle',         // hides the exact address
  circleRadiusInMeters: 300,
  isochrone: 'right',       // 5, 10 and 20 minute areas
  routeFrom: 'right',       // route to the place the visitor clicks
  height: 560,
});

// Or just the URL, for your own <iframe> or a server-rendered page:
const src = iframeUrl({ key: 'YOUR_FRONTEND_KEY', country: 'FR', latitude: 48.8566, longitude: 2.3522, mode: 'map-top' });
```

Every parameter of the [iframe plugin](https://documentation.yatmo.com/plugins/iframe) is typed: `zoom`, `mapStyle`,
`accentColor`, `rounded`, `customMarker`, `summaryBackgroundColor`, `summaryLineColor`, favourite addresses (`userId`,
`startLatitude`, `startLongitude`), plus `extra` for anything new.

## JavaScript map

```ts
import { mountMap } from '@yatmo/maps';

await mountMap({
  licenseKey: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR',
  container: 'map',                   // id of your element
  center: [4.3664, 50.8461],          // [longitude, latitude]
  zoom: 16,
  routeFrom: { latitude: 50.8461, longitude: 4.3664 },
  fullScreenButton: true,
});
```

The configuration is the `yatmoConfig` object of the [JavaScript map plugin](https://documentation.yatmo.com/plugins/js-map),
including the search features ([travel-time search](https://documentation.yatmo.com/plugins/advanced/travel-time-search),
[listings on the map](https://documentation.yatmo.com/plugins/advanced/listings)). The plugin handles one map per page:
call `mountMap` once, and use iframes when you need several maps.

## Summary table and neighbourhood text

```ts
import { mountSummary, mountSummaryText } from '@yatmo/maps';

await mountSummary({ licenseKey: KEY, country: 'BE', language: 'FR', container: 'summary', latitude: 50.8461, longitude: 4.3664 });

const text = await mountSummaryText(
  { licenseKey: KEY, country: 'BE', language: 'FR', latitude: 50.8461, longitude: 4.3664 },
  { container: 'text', heading: 'h3', titles: 'street-city' },   // or render: (result) => ... for your own markup
);
```

The text rendered in the browser is not seen by search engines. For an indexable text, render it on the server with
[@yatmo/sdk](https://www.npmjs.com/package/@yatmo/sdk) (`summaryText` + `renderSummaryText`).

## More

[Examples](https://github.com/Yatmo/yatmo-examples) · [WordPress](https://wordpress.org/plugins/yatmo-map/) ·
[Odoo](https://apps.odoo.com/apps/modules/20.0/yatmo_map) · [React Native](https://www.npmjs.com/package/@yatmo/react-native)

MIT licence. Yatmo is a paid service; a licence key is required.
