/*
 * The Yatmo integration for Astro: loads the Yatmo web components once per page and declares the
 * frontend key, country and language, so the <yatmo-map>, <yatmo-pois> and <yatmo-text> elements
 * (and the components of `@yatmo/astro/components`) only carry the property location.
 *
 *   // astro.config.mjs
 *   import yatmo from '@yatmo/astro';
 *   export default defineConfig({ integrations: [yatmo({ key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR' })] });
 */

export const ELEMENTS_SCRIPT = 'https://cdn.jsdelivr.net/npm/@yatmo/elements@1/dist/yatmo-elements.js';

export interface YatmoIntegrationOptions {
  /** Your Yatmo FRONTEND key, the one locked to your domains (https://documentation.yatmo.com/license). */
  key: string;
  /** Country of your properties: BE, FR, NL, LU, CH, DE, IT, ES, PT, IE, UK, AT, CA, GR, MA, AU, HR, MT, SI, RS, CY, BA, ME, BG, AL. */
  country: string;
  /** Language of labels and texts (EN, FR, NL, DE...), default EN. */
  language?: string;
  /** URL of the web components bundle, for self-hosting. */
  script?: string;
}

/** The subset of Astro's integration API this package uses; structurally compatible with `AstroIntegration`. */
export interface YatmoAstroIntegration {
  name: string;
  hooks: {
    'astro:config:setup': (options: { injectScript: (stage: 'head-inline' | 'before-hydration' | 'page' | 'page-ssr', content: string) => void }) => void;
  };
}

/** The inline script injected in every page: loads the elements once and declares the page config. */
export function headScript(options: YatmoIntegrationOptions): string {
  const script = JSON.stringify(options.script ?? ELEMENTS_SCRIPT);
  const config = JSON.stringify({ key: options.key, country: options.country.toUpperCase(), language: (options.language ?? 'EN').toUpperCase() });
  return `(function(){var d=document;if(!d.querySelector('script[data-yatmo-elements]')){var s=d.createElement('script');s.type='module';s.src=${script};s.setAttribute('data-yatmo-elements','');d.head.appendChild(s);}if(!d.querySelector('yatmo-config')){var c=d.createElement('yatmo-config'),v=${config};for(var k in v){c.setAttribute(k,v[k]);}d.head.appendChild(c);}})();`;
}

export default function yatmo(options: YatmoIntegrationOptions): YatmoAstroIntegration {
  if (!options?.key || !options?.country) {
    throw new Error('@yatmo/astro: yatmo({ key, country }) needs your frontend key and the country of your properties.');
  }
  return {
    name: '@yatmo/astro',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('head-inline', headScript(options));
        // YatmoNeighbourhoodText (build-time text) follows the integration's country and language unless .env says otherwise.
        const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
        if (env) {
          env.YATMO_COUNTRY ??= options.country.toUpperCase();
          env.YATMO_LANGUAGE ??= (options.language ?? 'EN').toUpperCase();
        }
      },
    },
  };
}
