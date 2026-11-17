'use client';

// A client module, so a server component can pass the default validator to `Form` as a client reference

import customizeValidator from './customizeValidator.ts';

// Annotated pure so a bundler can drop it: an app that imports only
// `createPrecompiledValidator` otherwise keeps this call, and with it AJV.
export default /* @__PURE__ */ customizeValidator();
