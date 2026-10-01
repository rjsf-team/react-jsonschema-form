import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import fs from 'fs';

import { compileSchemaValidatorsCode } from './compileSchemaValidatorsCode.ts';
import type { CompileValidatorOptionsType } from './types.ts';

export { compileSchemaValidatorsCode };

/** The function used to compile a schema into an output file in the form that allows it to be used as a precompiled
 * validator. The main reasons for using a precompiled validator is reducing code size, improving validation speed and,
 * most importantly, avoiding dynamic code compilation when prohibited by a browser's Content Security Policy. For more
 * information about AJV code compilation see: https://ajv.js.org/standalone.html
 *
 * @param schema - The schema to be compiled into a set of precompiled validators functions
 * @param output - The name of the file into which the precompiled validator functions will be generated
 * @param [options={}] - The `CompileValidatorOptionsType` to compile with: the same options that are passed to the
 *        `customizeValidator()` function to modify the behavior of the regular AJV-based validator, plus the form's
 *        `customMergeAllOf`, which must merge the same way as the one passed to the form or the form can validate
 *        against sub-schemas that were not compiled
 */
export default function compileSchemaValidators<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  output: string,
  options: CompileValidatorOptionsType<S> = {},
) {
  // oxlint-disable-next-line no-console
  console.log('parsing the schema');

  const moduleCode = compileSchemaValidatorsCode(schema, options);
  // oxlint-disable-next-line no-console
  console.log(`writing ${output}`);
  fs.writeFileSync(output, moduleCode);
}
