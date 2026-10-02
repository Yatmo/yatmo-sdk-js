/*
 * The Yatmo module for Nuxt: configuration in nuxt.config (or .env through runtime config), the Vue
 * components of @yatmo/vue auto-imported with the key, country and language already filled in, and
 * composables for the neighbourhood text and the nearest places, fetched on the server in SSR so the
 * text is part of the HTML search engines index.
 *
 *   // nuxt.config.ts
 *   export default defineNuxtConfig({
 *     modules: ['@yatmo/nuxt'],
 *     yatmo: { frontendKey: process.env.YATMO_FRONTEND_KEY, key: process.env.YATMO_KEY, country: 'BE', language: 'FR' },
 *   });
 */
import { addComponent, addImports, createResolver, defineNuxtModule } from '@nuxt/kit';
import { defu } from 'defu';

export interface ModuleOptions {
  /** Your Yatmo FRONTEND key, locked to your domains: used by the map and by the browser-side fetches. Also NUXT_PUBLIC_YATMO_KEY. */
  frontendKey?: string;
  /** Your Yatmo BACKEND key, kept on the server: used by the server-side composables. Also NUXT_YATMO_KEY. */
  key?: string;
  /** Country of your properties: BE, FR, NL, LU, CH, DE, IT, ES, PT, IE, UK, AT, CA, GR, MA, AU, HR, MT, SI, RS, CY, BA, ME, BG, AL. */
  country?: string;
  /** Language of labels and texts (EN, FR, NL, DE...). */
  language?: string;
}

export interface YatmoPublicRuntimeConfig {
  key: string;
  country: string;
  language: string;
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    yatmo: YatmoPublicRuntimeConfig;
  }
  interface RuntimeConfig {
    yatmo: { key: string };
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@yatmo/nuxt',
    configKey: 'yatmo',
    compatibility: { nuxt: '>=3.10.0' },
  },
  defaults: {
    country: 'BE',
    language: 'EN',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.public.yatmo = defu(nuxt.options.runtimeConfig.public.yatmo as Partial<YatmoPublicRuntimeConfig> | undefined, {
      key: options.frontendKey ?? '',
      country: (options.country ?? 'BE').toUpperCase(),
      language: (options.language ?? 'EN').toUpperCase(),
    });
    nuxt.options.runtimeConfig.yatmo = defu(nuxt.options.runtimeConfig.yatmo as { key?: string } | undefined, { key: options.key ?? '' });

    // The @yatmo/vue components, wrapped so the key, country and language come from the config.
    for (const name of ['YatmoMap', 'YatmoInteractiveMap', 'YatmoPois', 'YatmoNeighbourhoodText']) {
      addComponent({ name, export: name, filePath: resolver.resolve('./runtime/components') });
    }
    addImports([
      { name: 'useYatmo', from: resolver.resolve('./runtime/composables') },
      { name: 'useYatmoNeighbourhoodText', from: resolver.resolve('./runtime/composables') },
      { name: 'useYatmoSummary', from: resolver.resolve('./runtime/composables') },
    ]);
    nuxt.options.build.transpile.push('@yatmo/vue', '@yatmo/sdk', '@yatmo/maps');
  },
});
