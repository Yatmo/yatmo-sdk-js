/*
 * Validates the plugin options at build time.
 */
exports.pluginOptionsSchema = ({ Joi }) =>
  Joi.object({
    key: Joi.string().required().description('Your Yatmo FRONTEND key, the one locked to your domains (https://documentation.yatmo.com/license).'),
    country: Joi.string().required().description('Country of your properties: BE, FR, NL, LU, CH, DE, IT, ES, PT, IE, UK, AT, CA, GR, MA, AU, HR, MT, SI, RS, CY, BA, ME, BG, AL.'),
    language: Joi.string().default('EN').description('Language of labels and texts (EN, FR, NL, DE...).'),
    script: Joi.string().description('URL of the web components bundle, for self-hosting.'),
  });
