import { describe, expect, it } from 'vitest';
import { iframeUrl } from '../src/index.js';
// createIframe is covered in the elements tests (needs a DOM); a digits-only height becomes pixels there.

const base = { key: 'abc', country: 'BE' as const, latitude: 50.8461, longitude: 4.3664 };

describe('iframeUrl', () => {
  it('applies the defaults', () => {
    expect(iframeUrl(base)).toBe('https://map.yatmo.com/plugin.html?licenseKey=abc&country=BE&language=EN&latitude=50.8461&longitude=4.3664&mode=overlay&zoom=15');
  });

  it('maps every option to the plugin parameters', () => {
    const url = new URL(iframeUrl({
      ...base, language: 'FR', mode: 'map-top', zoom: 12, mapStyle: 'dark', accentColor: '#123456', marker: 'circle', circleRadiusInMeters: 300,
      rounded: 8, isochrone: 'right', routeFrom: 'popup', summaryBackgroundColor: '#fff', summaryLineColor: '#eee', userId: 'u1',
      startLatitude: 50.9, startLongitude: 4.4, extra: { corners: 'rounded' },
    }));
    const p = url.searchParams;
    expect(p.get('language')).toBe('FR');
    expect(p.get('mode')).toBe('map-top');
    expect(p.get('zoom')).toBe('12');
    expect(p.get('mapStyle')).toBe('6');
    expect(p.get('accentColor')).toBe('#123456');
    expect(p.get('marker')).toBe('circle');
    expect(p.get('circleRadiusInMeters')).toBe('300');
    expect(p.get('rounded')).toBe('8px');
    expect(p.get('isochrone')).toBe('right');
    expect(p.get('routeFrom')).toBe('popup');
    expect(p.get('summaryBackgroundColor')).toBe('#fff');
    expect(p.get('userId')).toBe('u1');
    expect(p.get('startLatitude')).toBe('50.9');
    expect(p.get('corners')).toBe('rounded');
  });

  it('handles custom markers and numeric styles', () => {
    const p = new URL(iframeUrl({ ...base, mapStyle: 3, marker: 'custom', customMarker: { url: 'https://x/y.png', width: 40, height: 50 } })).searchParams;
    expect(p.get('mapStyle')).toBe('3');
    expect(p.get('marker')).toBe('custom');
    expect(p.get('customMarkerUrl')).toBe('https://x/y.png');
    expect(p.get('customMarkerWidth')).toBe('40');
    // A custom marker without an image falls back to the pin.
    expect(new URL(iframeUrl({ ...base, marker: 'custom' })).searchParams.get('marker')).toBe('pin');
  });
});
