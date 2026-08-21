// Entry for the size-limit checks: what a consumer bundles when importing only Form.
// A shim file (rather than size-limit's `import` option) because that option
// cannot express a default export re-export; a relative path because @rjsf/core
// is not a root dependency, so it does not resolve from here.
// Kept in sync by hand: this guards only the Form import path. Other exports
// (withTheme, getDefaultRegistry, ...) are not measured; add a check to
// .size-limit.json if one grows a heavy dependency worth guarding.
export { default as Form } from '../packages/core/lib/index.js';
