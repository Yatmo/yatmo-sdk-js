# @yatmo/nuxt

Add real estate maps, points of interest and neighbourhood data to Nuxt applications.
`@yatmo/nuxt` is the official Nuxt module for [Yatmo](https://yatmo.com): one entry in `nuxt.config`, then
auto-imported components for the interactive map of the surroundings of a property (schools, shops, public
transport, real travel times on foot, by bike, by car and by transit, isochrones), the nearest places by
category, and the written neighbourhood text, fetched **on the server** so it is part of the HTML search
engines index. 25 countries, 23 languages, Nuxt 3 and 4.

```bash
npm install @yatmo/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@yatmo/nuxt'],
  yatmo: { country: 'BE', language: 'FR' },
  // keys in .env: NUXT_PUBLIC_YATMO_KEY (frontend) and NUXT_YATMO_KEY (backend)
});
```

```vue
<script setup lang="ts">
const { latitude, longitude } = listing;
const { data } = await useYatmoNeighbourhoodText({ latitude, longitude }, { titles: 'city' });
</script>

<template>
  <YatmoMap :latitude="latitude" :longitude="longitude" marker="circle" isochrone="right" />
  <YatmoPois :latitude="latitude" :longitude="longitude" :categories="['education', 'shopping']" />
  <YatmoNeighbourhoodText v-if="data" :text="data.text" />
</template>
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Yatmo/yatmo-nextjs-starter/main/docs/screenshot.png" width="720" alt="A property page with the Yatmo map, the nearest places and the neighbourhood text">
</p>

## Install in 5 minutes

1. Get a Yatmo licence at [yatmo.com](https://yatmo.com): a **frontend** key (locked to your domains, used by
   the map in the browser) and a **backend** key (kept on the server, used by the composables)
   ([keys explained](https://documentation.yatmo.com/license)).
2. `npm install @yatmo/nuxt`, add `'@yatmo/nuxt'` to `modules` and the country and language under `yatmo`.
3. `.env`: `NUXT_PUBLIC_YATMO_KEY=your_frontend_key` and `NUXT_YATMO_KEY=your_backend_key` (or `frontendKey`
   and `key` in the module options).
4. Use the components in your listing page with the property coordinates.

## What the module gives you

- **Components**, auto-imported, with the key, country and language already set: `YatmoMap` (the
  [iframe plugin](https://documentation.yatmo.com/plugins/iframe): every parameter is a prop), `YatmoInteractiveMap`
  (the JavaScript plugin, one per page, search features), `YatmoPois` (nearest places with travel times,
  `categories`, `mode`, `limit`, slots), `YatmoNeighbourhoodText` (headings and paragraphs, `paragraphs`, `heading`,
  `titles`). They are the [`@yatmo/vue`](https://www.npmjs.com/package/@yatmo/vue) components.
- **Composables**: `useYatmoNeighbourhoodText(position, options)` and `useYatmoSummary(position)` wrap
  `useAsyncData` and call Yatmo with the backend key on the server (the frontend key in the browser), so the
  text and the places are rendered in the HTML; `useYatmo()` returns the browser configuration for your own
  calls with [`@yatmo/sdk`](https://www.npmjs.com/package/@yatmo/sdk).
- **Runtime config**: `runtimeConfig.public.yatmo` (`key`, `country`, `language`) and `runtimeConfig.yatmo.key`,
  overridable per environment with the usual `NUXT_` variables.

## Why

A listing page that describes the neighbourhood, with real travel times to real places, is more useful to the
visitor and brings long-tail search traffic a map alone never brings. Nuxt renders the text on the server, so
it is indexed like your own content, and the map stays interactive.

## Links

- [Yatmo](https://yatmo.com), [documentation](https://documentation.yatmo.com/api/javascript-sdk)
- Other frameworks: [@yatmo/vue](https://www.npmjs.com/package/@yatmo/vue), [@yatmo/react](https://www.npmjs.com/package/@yatmo/react), [@yatmo/astro](https://www.npmjs.com/package/@yatmo/astro), [@yatmo/elements](https://www.npmjs.com/package/@yatmo/elements)
- [More examples](https://github.com/Yatmo/yatmo-examples)

MIT licence. Yatmo is a paid service for real estate portals, agency networks and developers; a licence key is required.
