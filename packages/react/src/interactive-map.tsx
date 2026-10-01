'use client';
import { useEffect, useId } from 'react';
import type { CSSProperties } from 'react';
import { mountMap, type MapConfig, type MapConfigKnown } from '@yatmo/maps';

export interface YatmoInteractiveMapProps {
  /** The `yatmoConfig` of the JavaScript plugin, without `container` (the component provides it). */
  config: Omit<MapConfigKnown, 'container'> & { [key: string]: unknown };
  /** Id of the map element. Defaults to a generated one. */
  id?: string;
  className?: string;
  /** Defaults to a 560px tall block. */
  style?: CSSProperties;
}

/**
 * The Yatmo JavaScript map plugin in a React element: the map blends into your page and exposes
 * the search features (travel-time search, listings on the map). The plugin handles one map per
 * page and reads its configuration once: mount it once, and use `YatmoMap` for several maps.
 * A client component: in Next.js, give it its config from a client component or pass only
 * serializable values.
 */
export function YatmoInteractiveMap({ config, id, className, style }: YatmoInteractiveMapProps) {
  const generated = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const container = id ?? `yatmo-map-${generated}`;
  useEffect(() => {
    void mountMap({ ...config, container } as MapConfig);
    // The plugin cannot be re-configured once loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);
  return <div id={container} className={className} style={{ width: '100%', height: '560px', ...style }} />;
}
