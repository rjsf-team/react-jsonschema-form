// ajv-i18n's own declarations describe an ES module with a default export, but its CommonJS runtime assigns the
// localizer straight to module.exports, so under Node's rules the default import would be typed as the module object.
declare module 'ajv-i18n/localize/es/index.js' {
  import type { Localize } from 'ajv-i18n/localize/types.js';

  const localize: Localize;
  export = localize;
}
