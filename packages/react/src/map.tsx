import { useEffect, useId } from 'react';
import type { CSSProperties } from 'react';
import { iframeUrl, mountMap, type IframeOptions, type MapConfig, type MapConfigKnown } from '@yatmo/maps';

/** `key` is reserved by React, so the Yatmo key is `licenseKey` here. */
export interface YatmoMapProps extends Omit<IframeOptions, 'key'> {
  /** Your frontend key, the one locked to your domains. */
  licenseKey: string;
  /** CSS height, `560px` by default. A number is taken as pixels. */
  height?: string | number;
  /** Accessible title of the iframe. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The Yatmo neighbourhood map of a property: points of interest, travel times, summary, isochrones
 * and routes, as the Yatmo iframe plugin. Renders on the server too (it is one `<iframe>`), and
 * several maps can share a page. Every option of https://documentation.yatmo.com/plugins/iframe is a prop.
 */
export function YatmoMap({ licenseKey, height, title, className, style, ...options }: YatmoMapProps) {
  const cssHeight = height === undefined ? '560px' : typeof height === 'number' ? `${height}px` : height;
  return (
    <iframe
      src={iframeUrl({ ...options, key: licenseKey })}
      title={title ?? 'Map and neighbourhood of the property'}
      loading="lazy"
      allow="fullscreen"
      className={className}
      style={{ display: 'block', width: '100%', height: cssHeight, border: 0, ...style }}
    />
  );
}

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
