# Changelog

## 1.1.0

`address` attribute on `<yatmo-map>`, `<yatmo-pois>` and `<yatmo-text>`: the property address, located by
Yatmo in the country of the config, instead of `latitude` and `longitude`. One lookup per address and page,
shared by the elements. For no-code sites (Webflow, Wix, Squarespace, Framer) that only hold an address.

## 1.0.0

First release: `<yatmo-config>`, `<yatmo-map>` (the iframe plugin with every parameter as an attribute),
`<yatmo-pois>` (nearest places by category with travel times) and `<yatmo-text>` (neighbourhood text), as
an ES module and as a single bundled file for `<script type="module">`.
