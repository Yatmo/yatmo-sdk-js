# Changelog

## 1.0.1

Works in React Server Components: `YatmoMap`, and `YatmoPois` / `YatmoNeighbourhoodText` given `summary` / `text`,
use no hooks; the browser-fetching variants and `YatmoInteractiveMap` are client components. `TextMarkup` and
`PoisMarkup` exported for custom wrappers.

## 1.0.0

First release: `YatmoMap` (the iframe plugin, server-renderable), `YatmoInteractiveMap` (the JavaScript map plugin),
`YatmoNeighbourhoodText` and `YatmoPois` (from server data or fetched in the browser), `useYatmoClient`,
`useYatmoText` and `useYatmoSummary` hooks. React 18 and 19.
