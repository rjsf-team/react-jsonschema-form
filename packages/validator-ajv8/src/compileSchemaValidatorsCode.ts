import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, REF_KEY, schemaKey, getValidationSchemas } from '@rjsf/utils';
import type { Ajv } from 'ajv';
// Node's ESM resolver has no directory-index lookup, so the file has to be named explicitly.
import uri from 'ajv/dist/runtime/uri.js';
import standaloneCode from 'ajv/dist/standalone/index.js';

import ajvRootSchemaId, { withAjvRootIdRefPrefix } from './ajvRootSchemaId.ts';
import createAjvInstance from './createAjvInstance.ts';
import { changesData } from './dataForValidation.ts';
import type { CustomValidatorOptionsType } from './types.ts';

/** Returns the schemas Ajv compiles for the `schemaMap`, by the id each is registered under, and what each function
 * the module exports is compiled from, by the key a precompiled validator looks it up under. The root is registered
 * under the id `ajvRootSchemaId()` gives for it, which its own `$id` need not be. A `{ $ref }` naming a subschema of
 * the root is exported as the function Ajv compiles for that subschema of the root, so nothing is compiled for it on
 * its own; every other schema is compiled under its key, with the `$ref`s local to the root naming it by that id.
 *
 * @param schemaMap - The schemas `getValidationSchemas()` lists
 * @param rootKey - The key the root is listed under
 * @param uriResolver - The `uriResolver` of the Ajv instance compiling them
 * @returns - The schemas to compile and the export names
 */
export function compiledSchemas<S extends StrictRJSFSchema = RJSFSchema>(
  schemaMap: Record<string, S>,
  rootKey: string,
  uriResolver: Ajv['opts']['uriResolver'],
): { schemas: Record<string, S>; exportNames: Record<string, string> } {
  const rootSchema = schemaMap[rootKey];
  const rootId = ajvRootSchemaId(rootSchema, uriResolver);
  const schemas: Record<string, S> = {};
  const exportNames: Record<string, string> = {};
  for (const [key, listed] of Object.entries(schemaMap)) {
    const { [ID_KEY]: _id, [REF_KEY]: ref, ...rest } = listed;
    if (key === rootKey) {
      schemas[rootId] = listed;
      exportNames[key] = rootId;
    } else if (typeof ref === 'string' && ref.startsWith('#') && Object.keys(rest).length === 0) {
      exportNames[key] = `${rootId}${ref}`;
    } else {
      schemas[key] = withAjvRootIdRefPrefix<S>(listed, rootSchema, rootId);
      exportNames[key] = key;
    }
  }
  return { schemas, exportNames };
}

/** The function used to compile a schema into javascript code in the form that allows it to be used as a precompiled
 * validator. The main reasons for using a precompiled validator is reducing code size, improving validation speed and,
 * most importantly, avoiding dynamic code compilation when prohibited by a browser's Content Security Policy. For more
 * information about AJV code compilation see: https://ajv.js.org/standalone.html. Compiled with Ajv options that change
 * the data validated, every function the code exports is marked with `changesData`, since the code carries no options.
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
  const { schemas, exportNames } = compiledSchemas(
    getValidationSchemas(schema),
    schemaKey(schema),
    ajvOptionsOverrides.uriResolver ?? uri.default,
  );

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

  const code = standaloneCode.default(ajv, exportNames);
  if (!changesData(ajv.opts)) {
    return code;
  }
  // Each export is named as Ajv names it in the code: an ES module exports an identifier, CommonJS a property
  const exported = (name: string) => (ajv.opts.code.esm ? name : `exports[${JSON.stringify(name)}]`);
  return [code, ...Object.keys(exportNames).map((name) => `${exported(name)}.changesData = true;`)].join('\n');
}
