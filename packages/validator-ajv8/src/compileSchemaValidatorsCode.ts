import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { schemaParser } from '@rjsf/utils';
// Node's ESM resolver has no directory-index lookup, so the file has to be named explicitly.
import standaloneCode from 'ajv/dist/standalone/index.js';

import createAjvInstance from './createAjvInstance.ts';
import type { CompileValidatorOptionsType } from './types.ts';

/** The function used to compile a schema into javascript code in the form that allows it to be used as a precompiled
 * validator. The main reasons for using a precompiled validator is reducing code size, improving validation speed and,
 * most importantly, avoiding dynamic code compilation when prohibited by a browser's Content Security Policy. For more
 * information about AJV code compilation see: https://ajv.js.org/standalone.html
 *
 * @param schema - The schema to be compiled into a set of precompiled validators functions
 * @param [options={}] - The `CompileValidatorOptionsType` to compile with: the same options that are passed to the
 *        `customizeValidator()` function to modify the behavior of the regular AJV-based validator, plus the form's
 *        `customMergeAllOf`, which must merge the same way as the one passed to the form or the form can validate
 *        against sub-schemas that were not compiled
 */
export function compileSchemaValidatorsCode<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  options: CompileValidatorOptionsType<S> = {},
) {
  const {
    additionalMetaSchemas,
    customFormats,
    ajvOptionsOverrides = {},
    ajvFormatOptions,
    AjvClass,
    extenderFn,
    customMergeAllOf,
  } = options;
  const schemaMaps = schemaParser(schema, { customMergeAllOf });
  const schemas = Object.values(schemaMaps);

  // Allow users to turn off the `lines: true` feature in their own overrides, but NOT the `source: true`
  const compileOptions = {
    ...ajvOptionsOverrides,
    code: { lines: true, ...ajvOptionsOverrides.code, source: true },
    schemas,
  };
  const ajv = createAjvInstance(
    additionalMetaSchemas,
    customFormats,
    compileOptions,
    ajvFormatOptions,
    AjvClass,
    extenderFn,
  );

  return standaloneCode.default(ajv);
}
