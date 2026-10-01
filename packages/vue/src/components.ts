import { computed, defineComponent, h, onMounted, type PropType, type VNodeChild } from 'vue';
import { iframeUrl, mountMap, type IframeOptions, type MapConfig, type MapConfigKnown } from '@yatmo/maps';
import type {
  Position, YatmoConfiguration, YatmoSummary, YatmoSummaryPlace, YatmoSummaryText, YatmoTextParagraph, YatmoTravelMode,
} from '@yatmo/sdk';
import { useYatmoClient, useYatmoSummary, useYatmoText } from './composables.js';

/** Category names accepted by `categories`, mapped to the summary category types. */
export const CATEGORY_TYPES: Record<string, number> = { education: 1, transport: 2, shopping: 3, tourism: 7 };

function cssHeight(height: string | number | undefined): string {
  if (height === undefined) return '560px';
  const raw = String(height).trim();
  return /^\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw;
}

/**
 * The Yatmo neighbourhood map of a property: points of interest, travel times, summary, isochrones
 * and routes, as the Yatmo iframe plugin. Renders on the server too (it is one `<iframe>`), and
 * several maps can share a page. Every option of https://documentation.yatmo.com/plugins/iframe is a prop.
 */
export const YatmoMap = defineComponent({
  name: 'YatmoMap',
  props: {
    /** Your frontend key, the one locked to your domains. */
    licenseKey: { type: String, required: true },
    country: { type: String as PropType<IframeOptions['country']>, required: true },
    language: { type: String as PropType<IframeOptions['language']>, default: undefined },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    mode: { type: String as PropType<IframeOptions['mode']>, default: undefined },
    zoom: { type: Number, default: undefined },
    mapStyle: { type: [String, Number] as PropType<IframeOptions['mapStyle']>, default: undefined },
    accentColor: { type: String, default: undefined },
    marker: { type: String as PropType<IframeOptions['marker']>, default: undefined },
    circleRadiusInMeters: { type: Number, default: undefined },
    customMarker: { type: Object as PropType<IframeOptions['customMarker']>, default: undefined },
    rounded: { type: Number, default: undefined },
    isochrone: { type: String as PropType<IframeOptions['isochrone']>, default: undefined },
    routeFrom: { type: String as PropType<IframeOptions['routeFrom']>, default: undefined },
    summaryBackgroundColor: { type: String, default: undefined },
    summaryLineColor: { type: String, default: undefined },
    userId: { type: String, default: undefined },
    startLatitude: { type: Number, default: undefined },
    startLongitude: { type: Number, default: undefined },
    extra: { type: Object as PropType<Record<string, string>>, default: undefined },
    /** CSS height, `560px` by default. A number is taken as pixels. */
    height: { type: [String, Number], default: undefined },
    /** Accessible title of the iframe. */
    title: { type: String, default: 'Map and neighbourhood of the property' },
  },
  setup(props) {
    const src = computed(() => {
      const { licenseKey, height, title, ...options } = props;
      void height; void title;
      return iframeUrl({ ...(options as Omit<IframeOptions, 'key'>), key: licenseKey });
    });
    return () => h('iframe', {
      src: src.value,
      title: props.title,
      loading: 'lazy',
      allow: 'fullscreen',
      style: { display: 'block', width: '100%', height: cssHeight(props.height), border: '0' },
    });
  },
});

/**
 * The Yatmo JavaScript map plugin in a Vue element: the map blends into your page and exposes the
 * search features (travel-time search, listings on the map). The plugin handles one map per page
 * and reads its configuration once: mount it once, and use `YatmoMap` for several maps.
 */
export const YatmoInteractiveMap = defineComponent({
  name: 'YatmoInteractiveMap',
  props: {
    /** The `yatmoConfig` of the JavaScript plugin, without `container` (the component provides it). */
    config: { type: Object as PropType<Omit<MapConfigKnown, 'container'> & { [key: string]: unknown }>, required: true },
    /** Id of the map element. */
    id: { type: String, default: 'yatmo-map' },
  },
  setup(props) {
    onMounted(() => { void mountMap({ ...props.config, container: props.id } as MapConfig); });
    return () => h('div', { id: props.id, style: { width: '100%', height: '560px' } });
  },
});

const dataProps = {
  /** Or fetch in the browser: the frontend key, country, language and the property position. */
  client: { type: Object as PropType<YatmoConfiguration & Position>, default: undefined },
};

/**
 * The written description of the neighbourhood (education, shopping, public transport, roads,
 * leisure, nearby cities) as headings and paragraphs, styled by your CSS. Give it `text` from the
 * server (`@yatmo/sdk`, `client.summaryText(position)`) for an indexable page, or `client` to fetch
 * in the browser once mounted. Slots: `fallback` (while loading), `error` (receives `{ error }`).
 */
export const YatmoNeighbourhoodText = defineComponent({
  name: 'YatmoNeighbourhoodText',
  props: {
    ...dataProps,
    text: { type: Object as PropType<YatmoSummaryText | null>, default: undefined },
    /** Heading tag of the paragraph titles. Defaults to `h3`; an empty string drops the titles. */
    heading: { type: String, default: 'h3' },
    /** Street name in the first title and city in the second (default), city only (discreet listings) or generic titles. */
    titles: { type: String as PropType<'street-city' | 'city' | 'generic'>, default: 'street-city' },
    /** Only these paragraph types, in this order: education, shopping, publictransports, transports, tourism, cities. */
    paragraphs: { type: Array as PropType<string[]>, default: undefined },
    /** Key places in `<strong>`. */
    strong: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const client = computed(() => props.client ?? null);
    const yatmo = useYatmoClient(computed(() => client.value ?? { key: 'none', country: 'BE' as const }));
    const position = computed(() => (client.value ? { latitude: client.value.latitude, longitude: client.value.longitude } : null));
    const query = useYatmoText(computed(() => (props.text === undefined && client.value ? yatmo.value : null)), position);
    return () => {
      const resolved = props.text !== undefined ? props.text : query.data.value;
      if (props.text === undefined && client.value) {
        if (query.error.value) return slots.error ? slots.error({ error: query.error.value }) : null;
        if (query.loading.value || !resolved) return slots.fallback ? slots.fallback() : null;
      }
      if (!resolved) return null;
      return renderText(resolved, props);
    };
  },
});

function titleOf(paragraph: YatmoTextParagraph, index: number, mode: 'street-city' | 'city' | 'generic'): string {
  if (mode === 'generic') return paragraph.title;
  if (mode === 'city') return (index === 0 && paragraph.titleCity) || paragraph.title;
  if (index === 0 && paragraph.titleStreet) return paragraph.titleStreet;
  if (index === 1 && paragraph.titleCity) return paragraph.titleCity;
  return paragraph.title;
}

/** Turns the `[STRONG]...[/STRONG]` markers of a sentence into `<strong>` nodes. */
export function markersToNodes(sentence: string, strong = true): VNodeChild[] {
  return sentence.trim().split(/\[STRONG\]|\[\/STRONG\]/).map((part, i) => (i % 2 === 1 && strong ? h('strong', part) : part)).filter((p) => p !== '');
}

function renderText(text: YatmoSummaryText, props: { heading: string; titles: 'street-city' | 'city' | 'generic'; paragraphs?: string[]; strong: boolean }): VNodeChild {
  const wanted = props.paragraphs?.map((p) => p.toLowerCase());
  const selected = wanted?.length ? text.paragraphs.filter((p) => wanted.includes(p.iconId.toLowerCase())) : text.paragraphs;
  return h('div', { class: 'yatmo-text' }, selected.map((paragraph, index) => h('div', { class: `yatmo-text-${paragraph.iconId}`, key: `${paragraph.iconId}-${index}` }, [
    props.heading ? h(props.heading, titleOf(paragraph, index, props.titles)) : null,
    paragraph.sentences.length ? h('p', paragraph.sentences.flatMap((s, i) => (i ? [' ', ...markersToNodes(s, props.strong)] : markersToNodes(s, props.strong)))) : null,
    paragraph.items.length ? h('ul', paragraph.items.map((item, i) => h('li', { key: i }, markersToNodes(item, props.strong)))) : null,
  ])));
}

/**
 * The nearest places around a property by category (nurseries, schools, supermarkets, bus stops,
 * stations...), each with its distance and travel time. Give it `summary` from the server or
 * `client` to fetch in the browser. Slots: `place` (scoped: `{ place, distance, time }`), `fallback`, `error`.
 */
export const YatmoPois = defineComponent({
  name: 'YatmoPois',
  props: {
    ...dataProps,
    summary: { type: Object as PropType<YatmoSummary | null>, default: undefined },
    /** Categories to show: education, transport, shopping, tourism. Defaults to all. */
    categories: { type: Array as PropType<string[]>, default: undefined },
    /** Travel mode of the time shown. Defaults to walking. */
    mode: { type: String as PropType<YatmoTravelMode>, default: 'walking' },
    /** Places per sub-category. Defaults to 1. */
    limit: { type: Number, default: 1 },
    /** Heading tag of the sub-category titles. Defaults to `h3`. */
    heading: { type: String, default: 'h3' },
  },
  setup(props, { slots }) {
    const client = computed(() => props.client ?? null);
    const yatmo = useYatmoClient(computed(() => client.value ?? { key: 'none', country: 'BE' as const }));
    const position = computed(() => (client.value ? { latitude: client.value.latitude, longitude: client.value.longitude } : null));
    const query = useYatmoSummary(computed(() => (props.summary === undefined && client.value ? yatmo.value : null)), position);
    return () => {
      const resolved = props.summary !== undefined ? props.summary : query.data.value;
      if (props.summary === undefined && client.value) {
        if (query.error.value) return slots.error ? slots.error({ error: query.error.value }) : null;
        if (query.loading.value || !resolved) return slots.fallback ? slots.fallback() : null;
      }
      if (!resolved) return null;
      const wanted = props.categories?.map((c) => CATEGORY_TYPES[c.toLowerCase()]).filter((t) => t !== undefined);
      const groups = resolved.categories
        .filter((category) => !wanted?.length || wanted.includes(category.categoryType))
        .flatMap((category) => category.subCategories.map((sub) => ({ category, sub, places: sub.places.slice(0, props.limit) })))
        .filter(({ places }) => places.length);
      return h('div', { class: 'yatmo-pois' }, groups.map(({ category, sub, places }) => h('div', { class: 'yatmo-pois-group', key: `${category.categoryType}-${sub.subType}` }, [
        h(props.heading, places.length === 1 && sub.singularLabel ? sub.singularLabel : sub.label),
        h('ul', places.map((place: YatmoSummaryPlace, i) => {
          const travel = place.travelData.find((t) => t.travelMode === props.mode && t.hasTravelInformation);
          const info = { distance: travel?.distanceShortLabel ?? null, time: travel?.travelTimeShortLabel ?? null };
          const content = slots.place ? slots.place({ place, ...info }) : info.time ? `${place.name} (${[info.distance, info.time].filter(Boolean).join(', ')})` : place.name;
          return h('li', { key: i }, content);
        })),
      ])));
    };
  },
});
