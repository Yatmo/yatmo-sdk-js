// @vitest-environment happy-dom
// Hermetic tests: fetch is replaced, Yatmo is never called. Server rendering is checked with renderToString.
import { renderToString } from 'react-dom/server';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { resolveSummaryText, summaryTextRawFromWire, summaryFromWire } from '@yatmo/sdk';
import { YatmoMap, YatmoNeighbourhoodText, YatmoPois, markersToNodes } from '../src/index.js';

const TEXT_WIRE = { Paragraphs: [
  { IconId: 'shopping', Title: { EN: 'Shops' }, TitleBis: { EN: 'Shops near Rue de la Loi' }, TitleTer: { EN: 'Shops in Brussels' }, Sentences: [{ EN: 'A [STRONG]Carrefour[/STRONG] 3 minutes away.' }, { EN: 'And a bakery.' }], List: [] },
  { IconId: 'education', Title: { EN: 'Schools' }, TitleBis: { EN: 'Schools near Rue de la Loi' }, TitleTer: { EN: 'Schools in Brussels' }, Sentences: [{ EN: 'Two schools.' }], List: [{ EN: 'School A' }] },
] };
const SUMMARY_WIRE = { AvailableCategoriesAroundPosition: [
  { ct: 1, l: 'Education', sc: [{ st: 4, l: 'Nurseries', lb: 'Nursery', d: [{ n: 'Little Bears', la: 50.84, lo: 4.36, td: [{ hti: true, tm: 2, ptdsl: '300 m', ttsl: "4'" }] }] }] },
  { ct: 3, l: 'Shopping', sc: [{ st: 9, l: 'Supermarkets', lb: 'Supermarket', d: [{ n: 'Carrefour', la: 50.84, lo: 4.36, td: [] }, { n: 'Delhaize', la: 50.84, lo: 4.36, td: [] }] }] },
], CloseCities: [], PlaceInformation: null };
const text = resolveSummaryText(summaryTextRawFromWire(TEXT_WIRE), 'EN');
const summary = summaryFromWire(SUMMARY_WIRE);
const client = { key: 'abc', country: 'BE' as const, language: 'EN' as const, latitude: 50.8461, longitude: 4.3664 };

beforeAll(() => {
  vi.stubGlobal('fetch', async (input: string | URL) => {
    const url = String(input);
    const body = url.includes('xx.yatmo.com') ? null : url.includes('/Summary/text') ? TEXT_WIRE : url.includes('/summary') ? SUMMARY_WIRE : null;
    return new Response(JSON.stringify(body ?? { Error: 'nope' }), { status: body ? 200 : 404, headers: { 'Content-Type': 'application/json' } });
  });
});
afterEach(() => { document.body.innerHTML = ''; });

describe('YatmoMap', () => {
  it('renders the iframe on the server with every option', () => {
    const { key, ...rest } = client;
    const html = renderToString(<YatmoMap licenseKey={key} {...rest} mode="map-top" marker="circle" circleRadiusInMeters={300} isochrone="right" height={400} className="m" />);
    expect(html).toContain('<iframe src="https://map.yatmo.com/plugin.html?licenseKey=abc&amp;country=BE&amp;language=EN&amp;latitude=50.8461&amp;longitude=4.3664&amp;mode=map-top&amp;zoom=15&amp;marker=circle&amp;circleRadiusInMeters=300&amp;isochrone=right"');
    expect(html).toContain('height:400px');
    expect(html).toContain('class="m"');
    expect(html).toContain('loading="lazy"');
  });
});

describe('YatmoNeighbourhoodText', () => {
  it('renders server-provided text with street and city titles and bold places', () => {
    const html = renderToString(<YatmoNeighbourhoodText text={text} />);
    expect(html).toBe(
      '<div class="yatmo-text"><div class="yatmo-text-shopping"><h3>Shops near Rue de la Loi</h3><p>A <strong>Carrefour</strong> 3 minutes away.<!-- --> <!-- -->And a bakery.</p></div>' +
      '<div class="yatmo-text-education"><h3>Schools in Brussels</h3><p>Two schools.</p><ul><li>School A</li></ul></div></div>',
    );
  });

  it('supports paragraph filtering, headings and discreet titles', () => {
    const html = renderToString(<YatmoNeighbourhoodText text={text} paragraphs={['education']} heading="h2" titles="city" className="mine" />);
    expect(html).toBe('<div class="yatmo-text mine"><div class="yatmo-text-education"><h2>Schools in Brussels</h2><p>Two schools.</p><ul><li>School A</li></ul></div></div>');
    expect(renderToString(<YatmoNeighbourhoodText text={text} heading={null} titles="generic" strong={false} />)).not.toContain('<h3>');
  });

  it('fetches in the browser with the client props', async () => {
    render(<YatmoNeighbourhoodText client={client} fallback={<span>loading</span>} />);
    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Shops near Rue de la Loi')).toBeTruthy());
    expect(document.querySelector('strong')?.textContent).toBe('Carrefour');
  });

  it('reports errors in client mode', async () => {
    render(<YatmoNeighbourhoodText client={{ ...client, country: 'XX' as never }} renderError={(e) => <em>{e.message}</em>} />);
    await waitFor(() => expect(screen.getByText(/404/)).toBeTruthy());
  });

  it('splits markers into nodes', () => {
    expect(markersToNodes('a [STRONG]b[/STRONG] c')).toHaveLength(3);
  });
});

describe('YatmoPois', () => {
  it('renders server-provided places with walking times', () => {
    const html = renderToString(<YatmoPois summary={summary} />);
    expect(html).toBe('<div class="yatmo-pois"><div class="yatmo-pois-group"><h3>Nursery</h3><ul><li>Little Bears (300 m, 4&#x27;)</li></ul></div><div class="yatmo-pois-group"><h3>Supermarket</h3><ul><li>Carrefour</li></ul></div></div>');
  });

  it('filters categories, limits places and accepts a custom renderer', () => {
    const html = renderToString(<YatmoPois summary={summary} categories={['shopping']} limit={2} heading="h4" renderPlace={(p) => <b>{p.name}</b>} />);
    expect(html).toBe('<div class="yatmo-pois"><div class="yatmo-pois-group"><h4>Supermarkets</h4><ul><li><b>Carrefour</b></li><li><b>Delhaize</b></li></ul></div></div>');
  });

  it('fetches in the browser with the client props', async () => {
    render(<YatmoPois client={client} />);
    await waitFor(() => expect(screen.getByText(/Little Bears/)).toBeTruthy());
  });
});
