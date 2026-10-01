import { computed, onMounted, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue';
import {
  createYatmoClient, type Position, type YatmoClient, type YatmoConfiguration, type YatmoSummary, type YatmoSummaryText,
} from '@yatmo/sdk';

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

function unref<T>(value: MaybeRef<T>): T {
  return value && typeof value === 'object' && 'value' in (value as object) ? (value as Ref<T>).value : (value as T);
}

/** A Yatmo client that follows its configuration. In the browser, pass the frontend key (the one locked to your domains). */
export function useYatmoClient(configuration: MaybeRef<YatmoConfiguration>): ComputedRef<YatmoClient> {
  return computed(() => createYatmoClient(unref(configuration)));
}

export interface YatmoQuery<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  /** Runs the request again. */
  refresh: () => Promise<void>;
}

/**
 * Loads once mounted (so the key stays out of server rendering) and whenever the client or the
 * position changes.
 */
function useYatmoQuery<T>(load: () => (() => Promise<T>) | null, deps: () => unknown[]): YatmoQuery<T> {
  const data = shallowRef<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<Error | null>(null);
  let current = 0;
  const refresh = async () => {
    const run = load();
    if (!run) return;
    const id = ++current;
    loading.value = true;
    error.value = null;
    try {
      const result = await run();
      if (id === current) data.value = result;
    } catch (e) {
      if (id === current) { data.value = null; error.value = e instanceof Error ? e : new Error(String(e)); }
    } finally {
      if (id === current) loading.value = false;
    }
  };
  onMounted(() => { void refresh(); });
  watch(deps, () => { void refresh(); });
  return { data, loading, error, refresh };
}

/** The neighbourhood text of a position, in the client's language (English fallback). */
export function useYatmoText(client: MaybeRef<YatmoClient | null>, position: MaybeRef<Position | null>, language?: string): YatmoQuery<YatmoSummaryText> {
  return useYatmoQuery(
    () => { const c = unref(client); const p = unref(position); return c && p ? () => c.summaryText(p, language) : null; },
    () => { const p = unref(position); return [unref(client), p?.latitude, p?.longitude, language]; },
  );
}

/** The nearest places by category around a position. */
export function useYatmoSummary(client: MaybeRef<YatmoClient | null>, position: MaybeRef<Position | null>): YatmoQuery<YatmoSummary> {
  return useYatmoQuery(
    () => { const c = unref(client); const p = unref(position); return c && p ? () => c.summary(p) : null; },
    () => { const p = unref(position); return [unref(client), p?.latitude, p?.longitude]; },
  );
}
