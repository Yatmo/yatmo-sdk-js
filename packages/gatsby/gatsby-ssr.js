/*
 * Injects, in the <head> of every page, the Yatmo web components script and the <yatmo-config> with the
 * frontend key, country and language given in gatsby-config.js:
 *
 *   { resolve: 'gatsby-plugin-yatmo', options: { key: 'YOUR_FRONTEND_KEY', country: 'BE', language: 'FR' } }
 */
const React = require('react');

const ELEMENTS_SCRIPT = 'https://cdn.jsdelivr.net/npm/@yatmo/elements@1/dist/yatmo-elements.js';

/** The inline script: declares the page config once (React itself cannot set an attribute named "key"). */
function configScript(options) {
  const config = JSON.stringify({ key: options.key, country: String(options.country).toUpperCase(), language: String(options.language || 'EN').toUpperCase() });
  return "(function(){var d=document;if(!d.querySelector('yatmo-config')){var c=d.createElement('yatmo-config'),v=" + config + ";for(var k in v){c.setAttribute(k,v[k]);}d.head.appendChild(c);}})();";
}

exports.onRenderBody = ({ setHeadComponents }, pluginOptions) => {
  const options = pluginOptions || {};
  if (!options.key || !options.country) return;
  setHeadComponents([
    React.createElement('script', { key: 'yatmo-elements', type: 'module', src: options.script || ELEMENTS_SCRIPT, 'data-yatmo-elements': '' }),
    React.createElement('script', { key: 'yatmo-config', dangerouslySetInnerHTML: { __html: configScript(options) } }),
  ]);
};

exports.configScript = configScript;
