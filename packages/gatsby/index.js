/*
 * The React components of @yatmo/react, for Gatsby pages:
 *   import { YatmoMap, YatmoPois, YatmoNeighbourhoodText } from 'gatsby-plugin-yatmo';
 * YatmoMap needs licenseKey, country and language props (the iframe is built at render time);
 * YatmoPois and YatmoNeighbourhoodText take either a client (browser fetch) or data fetched at build
 * time with @yatmo/sdk in gatsby-node.js (indexable text). See the README.
 */
module.exports = require('@yatmo/react');
