import type { ValidatorFunctions } from '../../src/index.ts';

/** Evaluates generated CJS module source into its exports object */
export default function loadModule(code: string): ValidatorFunctions {
  const module: { exports: ValidatorFunctions } = { exports: {} };
  // oxlint-disable-next-line no-new-func, no-implied-eval
  new Function('module', 'exports', code).call(undefined, module, module.exports);
  return module.exports;
}
