import createPrecompiledValidator from './createPrecompiledValidator.ts';
import customizeValidator from './customizeValidator.ts';

export { customizeValidator, createPrecompiledValidator };
export type { default as AJV8PrecompiledValidator } from './precompiledValidator.ts';
export type { default as AJV8Validator } from './validator.ts';
export type * from './types.ts';

// Annotated pure so a bundler can drop it: an app that imports only
// `createPrecompiledValidator` otherwise keeps this call, and with it AJV.
export default /* @__PURE__ */ customizeValidator();
