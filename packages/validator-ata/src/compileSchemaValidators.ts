import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import fs from 'fs';

import { compileSchemaValidatorsCode } from './compileSchemaValidatorsCode.ts';
import type { CustomValidatorOptionsType } from './types.ts';

export { compileSchemaValidatorsCode };

/** The function used to compile a schema into an output file in the form that allows it to be used as a precompiled
 * validator. The main reasons for using a precompiled validator is reducing code size, improving validation speed and,
 * most importantly, avoiding dynamic code compilation when prohibited by a browser's Content Security Policy. For more
 * information about ata standalone compilation see the ata-validator documentation.
 *
 * @param schema - The schema to be compiled into a set of precompiled validators functions
 * @param output - The name of the file into which the precompiled validator functions will be generated
 * @param [options={}] - The set of `CustomValidatorOptionsType` information used to alter the ata validator used for
 *        compiling the schema. These are the options of `customizeValidator()`, with limits: `extenderFn`, extra
 *        schemas without an `$id` and the `ataOptionsOverrides` keys `coerceTypes`, `removeAdditional` and `keywords`
 *        cannot be carried into the generated file and are ignored with a warning, the generated file never fills in
 *        `default` values, and `suppressDuplicateFiltering` belongs to `createPrecompiledValidator()`. See
 *        `compileSchemaValidatorsCode()` for details.
 */
export default function compileSchemaValidators<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  output: string,
  options: CustomValidatorOptionsType = {},
) {
  // oxlint-disable-next-line no-console
  console.log('parsing the schema');

  const moduleCode = compileSchemaValidatorsCode(schema, options);
  // oxlint-disable-next-line no-console
  console.log(`writing ${output}`);
  fs.writeFileSync(output, moduleCode);
}
