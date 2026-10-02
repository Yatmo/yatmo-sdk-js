// Hermetic tests of the integration; the components are checked by a real Astro build (see the README).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import yatmo, { ELEMENTS_SCRIPT, headScript } from '../src/index.js';

delete process.env.YATMO_COUNTRY;
delete process.env.YATMO_LANGUAGE;

describe('@yatmo/astro integration', () => {
  it('injects the elements script and the page config in the head', () => {
    const injected: Array<[string, string]> = [];
    const integration = yatmo({ key: 'abc', country: 'be', language: 'fr' });
    expect(integration.name).toBe('@yatmo/astro');
    integration.hooks['astro:config:setup']({ injectScript: (stage, content) => injected.push([stage, content]) });
    expect(injected).toHaveLength(1);
    expect(injected[0][0]).toBe('head-inline');
    const script = injected[0][1];
    expect(script).toContain(JSON.stringify(ELEMENTS_SCRIPT));
    expect(script).toContain('{"key":"abc","country":"BE","language":"FR"}');
    expect(script).toContain("querySelector('yatmo-config')");
    expect(process.env.YATMO_COUNTRY).toBe('BE');
    expect(process.env.YATMO_LANGUAGE).toBe('FR');
  });

  it('defaults the language to EN and accepts a self-hosted script', () => {
    expect(headScript({ key: 'k', country: 'FR', script: '/yatmo.js' })).toContain('"/yatmo.js"');
    expect(headScript({ key: 'k', country: 'FR' })).toContain('"language":"EN"');
  });

  it('refuses a configuration without key or country', () => {
    expect(() => yatmo({ key: '', country: 'BE' })).toThrow(/frontend key/);
  });

  it('ships the four components', () => {
    const index = readFileSync(new URL('../components/index.ts', import.meta.url), 'utf8');
    for (const name of ['YatmoMap', 'YatmoPois', 'YatmoText', 'YatmoNeighbourhoodText']) {
      expect(index).toContain(`./${name}.astro`);
      const source = readFileSync(new URL(`../components/${name}.astro`, import.meta.url), 'utf8');
      expect(source).toContain('interface Props');
    }
    expect(readFileSync(new URL('../components/YatmoNeighbourhoodText.astro', import.meta.url), 'utf8')).toContain('set:html');
  });
});
