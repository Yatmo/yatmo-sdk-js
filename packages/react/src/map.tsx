import type { CSSProperties } from 'react';
import { iframeUrl, type IframeOptions } from '@yatmo/maps';

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
 * and routes, as the Yatmo iframe plugin. No hooks, no client JavaScript: it renders in React Server
 * Components and on the server, and several maps can share a page. Every option of
 * https://documentation.yatmo.com/plugins/iframe is a prop.
 */
export function YatmoMap({ licenseKey, height, title, className, style, ...options }: YatmoMapProps) {
  const raw = height === undefined ? '560px' : String(height).trim();
  const cssHeight = /^\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw;
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
