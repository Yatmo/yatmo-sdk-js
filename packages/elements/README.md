# @yatmo/elements

Add real estate maps, points of interest and neighbourhood data to any website with one HTML element.
`@yatmo/elements` gives property pages the [Yatmo](https://yatmo.com) neighbourhood map (schools, nurseries,
supermarkets, public transport, stations, travel times, isochrones), a list of the nearest places and a written
neighbourhood text, as web components that work with no framework and no build step: Webflow, Wix custom code,
Drupal, Laravel Blade, Rails, static HTML, or inside React, Vue and Svelte. 25 countries, 23 languages.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@yatmo/elements@1/dist/yatmo-elements.js"></script>

<yatmo-config key="YOUR_FRONTEND_KEY" country="BE" language="FR"></yatmo-config>

<yatmo-map latitude="50.8461" longitude="4.3664" marker="circle" isochrone="right"></yatmo-map>
<yatmo-pois latitude="50.8461" longitude="4.3664" categories="education,shopping"></yatmo-pois>
<yatmo-text latitude="50.8461" longitude="4.3664"></yatmo-text>
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Yatmo/.github/main/profile/img/map-and-summary.png" width="720" alt="Yatmo neighbourhood map with points of interest and travel times on a property page">
</p>

## Install in 5 minutes

1. Get a Yatmo licence key at [yatmo.com](https://yatmo.com) and use the **frontend** key, the one locked to your
   domains ([keys explained](https://documentation.yatmo.com/license)).
2. Load the script, from the CDN as above or from npm (`npm install @yatmo/elements`, then `import '@yatmo/elements'`).
3. Put `<yatmo-config>` once in the page with your key, country and language.
4. Drop the elements where the property's neighbourhood belongs, with the property coordinates.

Runnable page: [yatmo-examples/10-web-components](https://github.com/Yatmo/yatmo-examples/tree/main/10-web-components).

## Elements

### `<yatmo-map>`

The interactive map of the neighbourhood, as the Yatmo iframe plugin: points of interest with real travel times on
foot, by bike, by car and by public transport, the summary over the map, isochrones and routes. Every parameter of
the [iframe plugin](https://documentation.yatmo.com/plugins/iframe) is an attribute, rebuilt live when it changes.

| Attribute | Values |
|---|---|
| `latitude`, `longitude` | Property coordinates |
| `address` | Instead of the coordinates: the property address, located by Yatmo in the country of the config (one lookup per address and page, shared by the three elements). For no-code pages (Webflow, Wix, Squarespace) that only hold an address |
| `mode` | `overlay` (default), `overlay-scores`, `map-top`, `map`, `summary`, `summary-tabs` |
| `zoom` | 7 to 20, default 15 |
| `map-style` | 1 to 7 |
| `accent-color` | Hex colour of the pin and highlights |
| `marker`, `circle-radius` | `pin`, `circle` (hides the exact address, radius in metres) or `custom` with `custom-marker-url`, `custom-marker-width`, `custom-marker-height` |
| `rounded` | Corner radius in pixels, 1 to 15 |
| `isochrone` | `left` or `right`: the 5, 10 and 20 minute areas |
| `route-from` | `left`, `right` or `popup`: route to the place the visitor clicks |
| `user-id`, `start-latitude`, `start-longitude` | Favourite addresses of a logged-in visitor |
| `height`, `title` | CSS height (default `560px`), accessible title |
| `key`, `country`, `language` | Override `<yatmo-config>` for this element |

### `<yatmo-pois>`

The nearest places by category (nursery, school, supermarket, bus stop, station...) with distance and travel time,
as headings and lists styled by your CSS.

| Attribute | Values |
|---|---|
| `latitude`, `longitude` or `address` | The property location, as for `<yatmo-map>` |
| `categories` | `education`, `transport`, `shopping`, `tourism` (default: all) |
| `mode` | Travel time shown: `walking` (default), `bicycling`, `driving`, `transit` |
| `limit` | Places per sub-category, default 1 |
| `heading` | `h2` to `h6`, default `h3` |

Fires a `yatmo-pois` event with the summary once loaded.

### `<yatmo-text>`

The written description of the neighbourhood (education, shopping, public transport, roads, leisure, nearby
cities), headings and paragraphs with the key places in bold.

| Attribute | Values |
|---|---|
| `latitude`, `longitude` or `address` | The property location, as for `<yatmo-map>` |
| `paragraphs` | Comma-separated among `education`, `shopping`, `publictransports`, `transports`, `tourism`, `cities` |
| `heading` | `h2` to `h6`, default `h3` |
| `titles` | `street-city` (default), `city` (never names the street), `generic` |

Fires a `yatmo-text` event with the text once loaded. The text is fetched in the browser; to have search engines
index it, render it on the server with [@yatmo/sdk](https://www.npmjs.com/package/@yatmo/sdk), the
[WordPress plugin](https://wordpress.org/plugins/yatmo-map/) or the [Odoo module](https://apps.odoo.com/apps/modules/20.0/yatmo_map).

## Styling

The elements render plain HTML in the light DOM (`<iframe>`, `<h3>`, `<ul>`, `<p>`, `<strong>`), so your page CSS
applies. The map takes the width of its element; set `height` on `<yatmo-map>`.

## More

[Examples](https://github.com/Yatmo/yatmo-examples) · [Documentation](https://documentation.yatmo.com) ·
[React components](https://www.npmjs.com/package/@yatmo/react) · [API client](https://www.npmjs.com/package/@yatmo/sdk)

MIT licence. Yatmo is a paid service for real estate portals, agency networks and developers; a licence key is required.
