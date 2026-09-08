import type { RJSFSchema } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../../src/compileSchemaValidators.ts';
import type { CustomValidatorOptionsType, ValidatorFunctions } from '../../src/index.ts';
import superSchemaObj from './superSchema.json';
import { CUSTOM_OPTIONS, expectWarn } from './testData.ts';

export const superSchema = superSchemaObj as unknown as RJSFSchema;

export const SUPER_SCHEMA_OPTIONS: CustomValidatorOptionsType = {
  ...CUSTOM_OPTIONS,
  ajvOptionsOverrides: { ...CUSTOM_OPTIONS.ajvOptionsOverrides, code: { lines: false } },
};

/** Evaluates AJV standalone-validator code in memory, avoiding fixture-file round-trips.
 * The generated code assigns each validator onto a CommonJS-style `exports` object and, depending
 * on the schema's keywords/formats, may `require()` AJV runtime helpers — so both are provided.
 */
export function evalValidatorCode(code: string): ValidatorFunctions {
  const validateFns = {};
  // oxlint-disable-next-line no-new-func, typescript/no-implied-eval
  new Function('exports', 'require', code)(validateFns, require);
  return validateFns as ValidatorFunctions;
}

/** Compiles superSchema into standalone-validator code and loads it, entirely in memory. */
export function compileSuperSchema(options?: CustomValidatorOptionsType): ValidatorFunctions {
  const compile = () => compileSchemaValidatorsCode(superSchema, options);
  // without custom options, superSchema's "phone-us" format is unregistered and AJV warns about it
  const code = options ? compile() : expectWarn(compile, expect.stringContaining('unknown format'));
  return evalValidatorCode(code);
}
