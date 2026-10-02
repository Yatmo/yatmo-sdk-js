# gatsby-plugin-yatmo

Add real estate maps, points of interest and neighbourhood data to Gatsby sites.
`gatsby-plugin-yatmo` is the official Gatsby plugin for [Yatmo](https://yatmo.com): it loads the Yatmo web
components once per page with your key, and gives you the React components for the interactive map of the
surroundings of a property (schools, shops, public transport, real travel times, isochrones), the nearest
places by category and the written neighbourhood text, which you can fetch at build time so search engines
index it. 25 countries, 23 languages.

```bash
npm install gatsby-plugin-yatmo
```

```js
// gatsby-config.js
module.exports = {
  plugins: [{ resolve: 'gatsby-plugin-yatmo', options: { key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR' } }],
};
```

```jsx
// src/templates/listing.js
import { YatmoMap, YatmoPois, YatmoNeighbourhoodText } from 'gatsby-plugin-yatmo';

const yatmo = { key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR' };

export default function Listing({ pageContext: { latitude, longitude, neighbourhoodText } }) {
  return (
    <>
      <YatmoMap licenseKey={yatmo.key} country="BE" language="FR" latitude={latitude} longitude={longitude} marker="circle" isochrone="right" />
      <YatmoPois client={yatmo} latitude={latitude} longitude={longitude} categories={['education', 'shopping']} />
      <YatmoNeighbourhoodText text={neighbourhoodText} titles="city" />
    </>
  );
}
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Yatmo/yatmo-nextjs-starter/main/docs/screenshot.png" width="720" alt="A property page with the Yatmo map, the nearest places and the neighbourhood text">
</p>

## Install in 5 minutes

1. Get a Yatmo licence at [yatmo.com](https://yatmo.com): a **frontend** key (locked to your domains, used in
   the browser) and a **backend** key (kept on the build machine) ([keys explained](https://documentation.yatmo.com/license)).
2. `npm install gatsby-plugin-yatmo` and add the plugin to `gatsby-config.js` with the frontend key, country and language.
3. Use the components in your listing template. The plugin also registers the
   [`<yatmo-map>`, `<yatmo-pois>` and `<yatmo-text>` elements](https://www.npmjs.com/package/@yatmo/elements),
   usable straight in JSX with an `address` or coordinates when you prefer no React props at all.

## Indexable neighbourhood text

Fetch the text while creating pages, with the backend key, and pass it to the template: it is then part of the
static HTML.

```js
// gatsby-node.js
const { createYatmoClient } = require('@yatmo/sdk');

exports.createPages = async ({ actions }) => {
  const yatmo = createYatmoClient({ key: process.env.YATMO_KEY, country: 'BE', language: 'FR' });
  for (const listing of listings) {
    const neighbourhoodText = await yatmo.summaryText({ latitude: listing.latitude, longitude: listing.longitude });
    actions.createPage({ path: `/listings/${listing.slug}`, component: require.resolve('./src/templates/listing.js'), context: { ...listing, neighbourhoodText } });
  }
};
```

## Components

The components are those of [`@yatmo/react`](https://www.npmjs.com/package/@yatmo/react): `YatmoMap` (every
[iframe plugin](https://documentation.yatmo.com/plugins/iframe) parameter as a prop), `YatmoPois` (`client` or a
`summary` fetched at build time; `categories`, `mode`, `limit`), `YatmoNeighbourhoodText` (`client` or `text`;
`paragraphs`, `heading`, `titles`) and the hooks `useYatmoClient`, `useYatmoSummary`, `useYatmoText`.

## Why

A listing page that describes the neighbourhood, with real travel times to real places, is more useful to the
visitor and brings long-tail search traffic a map alone never brings. Gatsby builds the text into the page, so
it is indexed like your own content, and the map stays interactive.

## Links

- [Yatmo](https://yatmo.com), [documentation](https://documentation.yatmo.com/api/javascript-sdk)
- Other frameworks: [@yatmo/react](https://www.npmjs.com/package/@yatmo/react), [Next.js starter](https://github.com/Yatmo/yatmo-nextjs-starter), [@yatmo/astro](https://www.npmjs.com/package/@yatmo/astro), [@yatmo/nuxt](https://www.npmjs.com/package/@yatmo/nuxt)
- [More examples](https://github.com/Yatmo/yatmo-examples)

MIT licence. Yatmo is a paid service for real estate portals, agency networks and developers; a licence key is required.
