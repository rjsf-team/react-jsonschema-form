import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, REF_KEY, schemaKey, getValidationSchemas, withIdRefPrefix } from '@rjsf/utils';
// Node's ESM resolver has no directory-index lookup, so the file has to be named explicitly.
import standaloneCode from 'ajv/dist/standalone/index.js';

import createAjvInstance from './createAjvInstance.ts';
import type { CustomValidatorOptionsType } from './types.ts';

/** Returns the schemas Ajv compiles for the `schemaMap`, and what each function the module exports is compiled from,
 * by the key a precompiled validator looks it up under. A `{ $ref }` naming a subschema of the root is exported as
 * the function Ajv compiles for that subschema of the root, so nothing is compiled for it on its own; every other
 * schema is compiled under its key, with the `$ref`s local to the root naming it by `rootId`.
 *
 * @param schemaMap - The schemas `getValidationSchemas()` lists
 * @param rootId - The key the root is listed under
 * @returns - The schemas to compile and the export names
 */
export function compiledSchemas<S extends StrictRJSFSchema = RJSFSchema>(
  schemaMap: Record<string, S>,
  rootId: string,
): { schemas: S[]; exportNames: Record<string, string> } {
  const schemas: S[] = [];
  const exportNames: Record<string, string> = {};
  for (const [key, listed] of Object.entries(schemaMap)) {
    const { [ID_KEY]: _id, [REF_KEY]: ref, ...rest } = listed;
    if (key !== rootId && typeof ref === 'string' && ref.startsWith('#') && Object.keys(rest).length === 0) {
      exportNames[key] = `${rootId.replace(/#$/, '')}${ref}`;
    } else {
      schemas.push(key === rootId ? listed : withIdRefPrefix<S>(listed, rootId));
      exportNames[key] = key;
    }
  }
  return { schemas, exportNames };
}

/** The function used to compile a schema into javascript code in the form that allows it to be used as a precompiled
 * validator. The main reasons for using a precompiled validator is reducing code size, improving validation speed and,
 * most importantly, avoiding dynamic code compilation when prohibited by a browser's Content Security Policy. For more
 * information about AJV code compilation see: https://ajv.js.org/standalone.html
 *
 * @param schema - The schema to be compiled into a set of precompiled validators functions
 * @param [options={}] - The `CustomValidatorOptionsType` to compile with: the same options that are passed to the
 *        `customizeValidator()` function to modify the behavior of the regular AJV-based validator
 */
export function compileSchemaValidatorsCode<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  options: CustomValidatorOptionsType = {},
) {
  const {
    additionalMetaSchemas,
    customFormats,
    ajvOptionsOverrides = {},
    ajvFormatOptions,
    AjvClass,
    extenderFn,
  } = options;
  const rootId = schemaKey(schema);
  const { schemas, exportNames } = compiledSchemas(getValidationSchemas(schema), rootId);

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

  return standaloneCode.default(ajv, exportNames);
}
