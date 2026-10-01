/*
 * Real estate maps, points of interest and neighbourhood text as HTML elements.
 * Importing this module registers <yatmo-config>, <yatmo-map>, <yatmo-pois> and <yatmo-text>.
 */
import { YatmoConfigElement, define } from './shared.js';
import { YatmoMapElement } from './yatmo-map.js';
import { YatmoPoisElement, renderPois, CATEGORY_TYPES } from './yatmo-pois.js';
import { YatmoTextElement } from './yatmo-text.js';

define('yatmo-config', YatmoConfigElement);
define('yatmo-map', YatmoMapElement);
define('yatmo-pois', YatmoPoisElement);
define('yatmo-text', YatmoTextElement);

export { YatmoConfigElement, YatmoMapElement, YatmoPoisElement, YatmoTextElement, renderPois, CATEGORY_TYPES };
export type { RenderPoisOptions } from './yatmo-pois.js';
export type { Settings } from './shared.js';
