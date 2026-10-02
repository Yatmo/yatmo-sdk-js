/*
 * The @yatmo/vue components with the key, country and language filled in from the module config,
 * so a page only passes the property location:
 *   <YatmoMap :latitude="50.8461" :longitude="4.3664" marker="circle" />
 *   <YatmoPois :latitude="50.8461" :longitude="4.3664" />
 *   <YatmoNeighbourhoodText :text="data.text" />   (with useYatmoNeighbourhoodText, indexable)
 */
import { defineComponent, h } from 'vue';
import { useRuntimeConfig } from '#imports';
import {
  YatmoInteractiveMap as VueInteractiveMap,
  YatmoMap as VueMap,
  YatmoNeighbourhoodText as VueNeighbourhoodText,
  YatmoPois as VuePois,
} from '@yatmo/vue';

function configOf(): { key: string; country: string; language: string } {
  const config = useRuntimeConfig().public.yatmo;
  return { key: config.key, country: config.country, language: config.language };
}

export const YatmoMap = defineComponent({
  name: 'YatmoMap',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const config = configOf();
    return () => h(VueMap, { licenseKey: config.key, country: config.country, language: config.language, ...attrs } as never);
  },
});

export const YatmoInteractiveMap = defineComponent({
  name: 'YatmoInteractiveMap',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const config = configOf();
    return () => h(VueInteractiveMap, { licenseKey: config.key, country: config.country, language: config.language, ...attrs } as never);
  },
});

export const YatmoPois = defineComponent({
  name: 'YatmoPois',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const config = configOf();
    return () => h(VuePois, { client: config, ...attrs } as never, slots);
  },
});

export const YatmoNeighbourhoodText = defineComponent({
  name: 'YatmoNeighbourhoodText',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const config = configOf();
    return () => h(VueNeighbourhoodText, { client: config, ...attrs } as never, slots);
  },
});
