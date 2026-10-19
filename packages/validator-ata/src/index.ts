import createPrecompiledValidator from './createPrecompiledValidator.ts';
import customizeValidator from './customizeValidator.ts';

export { customizeValidator, createPrecompiledValidator };
export { default as ATAValidator } from './validator.ts';
export type * from './types.ts';

// Annotated pure so a bundler can drop it: an app that imports only
// `createPrecompiledValidator` otherwise keeps this call, and with it all of
// ata-validator's runtime.
export default /* @__PURE__ */ customizeValidator();
