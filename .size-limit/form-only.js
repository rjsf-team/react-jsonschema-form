// Entry for the size-limit checks: what a consumer bundles when importing only Form.
// A shim file (rather than size-limit's `import` option) because that option
// cannot express a default export re-export; a relative path because @rjsf/core
// is not a root dependency, so it does not resolve from here.
export { default as Form } from '../packages/core/lib/index.js';
