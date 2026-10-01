// @vitest-environment happy-dom
// Hermetic tests of the custom elements: fetch is replaced, Yatmo is never called.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const SUMMARY_TEXT = { Paragraphs: [{ IconId: 'education', Title: { EN: 'Schools', FR: 'Écoles' }, TitleBis: { EN: 'Schools near Rue de la Loi' }, TitleTer: { EN: 'Schools in Brussels' }, Sentences: [{ EN: 'A [STRONG]nursery[/STRONG] 2 minutes away.', FR: 'Une crèche.' }], List: [] }] };
const SUMMARY = { AvailableCategoriesAroundPosition: [
  { ct: 1, l: 'Education', sc: [{ st: 4, l: 'Nurseries', lb: 'Nursery', d: [{ n: 'Little Bears', la: 50.84, lo: 4.36, td: [{ hti: true, tm: 2, ptdsl: '300 m', ttsl: "4'" }] }] }] },
  { ct: 3, l: 'Shopping', sc: [{ st: 9, l: 'Supermarkets', lb: 'Supermarket', d: [{ n: 'Carrefour', la: 50.84, lo: 4.36, td: [] }, { n: 'Delhaize', la: 50.84, lo: 4.36, td: [] }] }] },
], CloseCities: [], PlaceInformation: null };

const calls: string[] = [];
beforeAll(async () => {
  vi.stubGlobal('fetch', async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    const body = url.includes('xx.yatmo.com') ? null : url.includes('/Summary/text') ? SUMMARY_TEXT : url.includes('/summary') ? SUMMARY : null;
    return new Response(JSON.stringify(body ?? { Error: 'nope' }), { status: body ? 200 : 404, headers: { 'Content-Type': 'application/json' } });
  });
  await import('../src/index.js');
});
afterEach(() => { document.body.innerHTML = ''; calls.length = 0; });

const tick = () => new Promise((r) => setTimeout(r, 10));

describe('<yatmo-map>', () => {
  it('renders the plugin iframe from its attributes and the page config', async () => {
    document.body.innerHTML = '<yatmo-config key="abc" country="BE" language="FR"></yatmo-config><yatmo-map latitude="50.8461" longitude="4.3664" mode="map-top" marker="circle" circle-radius="300" isochrone="right" height="400"></yatmo-map>';
    await tick();
    const iframe = document.querySelector('yatmo-map iframe') as HTMLIFrameElement;
    expect(iframe).toBeTruthy();
    const p = new URL(iframe.src).searchParams;
    expect(p.get('licenseKey')).toBe('abc');
    expect(p.get('country')).toBe('BE');
    expect(p.get('language')).toBe('FR');
    expect(p.get('mode')).toBe('map-top');
    expect(p.get('marker')).toBe('circle');
    expect(p.get('circleRadiusInMeters')).toBe('300');
    expect(p.get('isochrone')).toBe('right');
    expect(iframe.style.height).toBe('400px');
    expect(calls).toEqual([]);
  });

  it('follows attribute changes and element attributes win over the config', async () => {
    document.body.innerHTML = '<yatmo-config key="abc" country="BE"></yatmo-config><yatmo-map key="own" latitude="50.8461" longitude="4.3664"></yatmo-map>';
    await tick();
    const el = document.querySelector('yatmo-map') as HTMLElement & { src: string };
    expect(new URL(el.src).searchParams.get('licenseKey')).toBe('own');
    el.setAttribute('mode', 'summary-tabs');
    await tick();
    expect(new URL(el.src).searchParams.get('mode')).toBe('summary-tabs');
  });

  it('shows a notice when the location or the key is missing', async () => {
    document.body.innerHTML = '<yatmo-map key="k" country="BE"></yatmo-map><yatmo-map latitude="1" longitude="2"></yatmo-map>';
    await tick();
    const notices = [...document.querySelectorAll('yatmo-map .yatmo-notice')].map((n) => n.textContent);
    expect(notices[0]).toContain('latitude and longitude');
    expect(notices[1]).toContain('key and a country');
  });
});

describe('<yatmo-text>', () => {
  it('fetches the text with the key header and renders headings and bold places', async () => {
    document.body.innerHTML = '<yatmo-config key="abc" country="BE"></yatmo-config><yatmo-text latitude="50.8461" longitude="4.3664" heading="h2"></yatmo-text>';
    await tick();
    await tick();
    expect(calls[0]).toContain('https://be.yatmo.com/Summary/text?latitude=50.8461000');
    const el = document.querySelector('yatmo-text') as HTMLElement;
    expect(el.innerHTML).toBe('<div class="yatmo-text"><h2>Schools near Rue de la Loi</h2><p>A <strong>nursery</strong> 2 minutes away.</p></div>');
  });

  it('filters paragraphs and uses discreet titles', async () => {
    document.body.innerHTML = '<yatmo-text key="abc" country="BE" latitude="50.8461" longitude="4.3664" paragraphs="shopping" titles="city"></yatmo-text>';
    await tick();
    await tick();
    expect(document.querySelector('yatmo-text .yatmo-text')?.innerHTML).toBe('');
  });
});

describe('<yatmo-pois>', () => {
  it('lists the nearest places by category with the walking time', async () => {
    document.body.innerHTML = '<yatmo-pois key="abc" country="BE" latitude="50.8461" longitude="4.3664"></yatmo-pois>';
    await tick();
    await tick();
    const el = document.querySelector('yatmo-pois') as HTMLElement;
    expect(el.innerHTML).toBe("<h3>Nursery</h3><ul><li>Little Bears (300 m, 4')</li></ul><h3>Supermarket</h3><ul><li>Carrefour</li></ul>");
  });

  it('filters categories and limits the places', async () => {
    document.body.innerHTML = '<yatmo-pois key="abc" country="BE" latitude="50.8461" longitude="4.3664" categories="shopping" limit="2" heading="h4"></yatmo-pois>';
    await tick();
    await tick();
    expect(document.querySelector('yatmo-pois')?.innerHTML).toBe('<h4>Supermarkets</h4><ul><li>Carrefour</li><li>Delhaize</li></ul>');
  });

  it('shows the API error', async () => {
    document.body.innerHTML = '<yatmo-pois key="abc" country="XX" latitude="50.8461" longitude="4.3664"></yatmo-pois>';
    await tick();
    await tick();
    expect(document.querySelector('yatmo-pois .yatmo-notice')?.textContent).toContain('404');
  });
});
