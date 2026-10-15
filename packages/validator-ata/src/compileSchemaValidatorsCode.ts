import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getByPath, ID_KEY, isObject, REF_KEY, schemaKey, getValidationSchemas } from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import type { CompileValidatorOptionsType } from './types.ts';

/** The keywords whose definitions a `$ref` in a compiled schema can name. ata resolves a `$ref` only to an entry of one
 * of these, in the document it compiles
 */
const CONTAINERS = ['definitions', '$defs'];

/** Returns the subschema at the `$ref` fragment `ref` of `root` */
function subschemaAt(root: unknown, ref: string): unknown {
  const tokens = ref
    .split('/')
    .slice(1)
    .map((token) => decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~'));
  return getByPath(root, tokens);
}

/** Returns each schema of the `schemaMap` as a document ata compiles on its own. ata names no subschema of another
 * document, so a `{ $ref }` naming a subschema of the root is compiled as a copy of that subschema, and the root's
 * `definitions` and `$defs` are hoisted beside every schema but the root, where a `$ref` to one of their entries
 * resolves. A `$ref` of any other form, such as one naming a property, leaves ata nothing to compile, which the
 * module reports when the schema is first validated against.
 *
 * @param schemaMap - The schemas `getValidationSchemas()` lists
 * @param rootSchema - The root they were listed for
 * @returns - The documents, in the order of the map
 */
function hoistedSchemas<S extends StrictRJSFSchema>(schemaMap: Record<string, S>, rootSchema: S): GenericObjectType[] {
  const rootId = schemaKey(rootSchema);
  const containers = Object.fromEntries(
    CONTAINERS.flatMap((key) => (key in rootSchema ? [[key, Reflect.get(rootSchema, key)]] : [])),
  );
  return Object.entries(schemaMap).map(([key, listed]) => {
    if (key === rootId) {
      return listed;
    }
    const { [ID_KEY]: _id, [REF_KEY]: ref, ...rest } = listed;
    const target = typeof ref === 'string' && Object.keys(rest).length === 0 ? subschemaAt(rootSchema, ref) : undefined;
    let content: GenericObjectType = listed;
    if (isObject(target)) {
      content = target;
    } else if (typeof target === 'boolean') {
      // ata compiles neither a boolean schema nor one asserting nothing, so a boolean subschema is compiled as an
      // object schema asserting what it says
      content = target ? { not: { not: {} } } : { not: {} };
    }
    return { ...content, ...containers, [ID_KEY]: key };
  });
}

/** Compiles a schema into a precompiled validator module. ata's
 * `bundleStandalone` emits `module.exports = [fn, ...]`, one validator per
 * schema in order, where each `fn(data)` returns `{ valid, errors }`. This wraps
 * that array into the `{ [id]: (data) => boolean }`-with-`errors` map that
 * `createPrecompiledValidator` consumes, keyed the same way `getValidationSchemas()` keys
 * the schemas so the precompiled validator can look each one up.
 *
 * @param schema - The schema to compile
 * @param [options={}] - The `CompileValidatorOptionsType` to compile with: the options used to build the validator. A
 *        `customMergeAllOf` among them is not read: the schemas compiled do not depend on how `allOf` is merged
 */
export function compileSchemaValidatorsCode<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  options: CompileValidatorOptionsType<S> = {},
) {
  const { customFormats, ataOptionsOverrides = {} } = options;
  const schemaMaps = getValidationSchemas(schema);
  const keys = Object.keys(schemaMaps);
  const schemas = hoistedSchemas(schemaMaps, schema);

  // Format checkers are serialized into the standalone module via Function#toString,
  // so they must carry no closure references or build-time instrumentation (a plain
  // arrow over the source file picks up coverage counters). Building each from its
  // regex via `new Function` produces a function whose source is exactly its body.
  const regexFormats: Record<string, RegExp> = {
    color: COLOR_FORMAT_REGEX,
    'data-url': DATA_URL_FORMAT_REGEX,
  };
  if (customFormats) {
    for (const [name, check] of Object.entries(customFormats)) {
      if (typeof check === 'function') {
        // A function checker would be serialized via toString, which is unsafe in a
        // precompiled bundle: transpilers, minifiers, and coverage tools rewrite the
        // body and leave references that do not exist in the generated module. Only
        // RegExp/string patterns can be embedded reliably here.
        throw new Error(
          `@rjsf/validator-ata: custom format "${name}" is a function, which is not supported by the precompiled validator; provide a RegExp or string pattern instead`,
        );
      }
      regexFormats[name] = typeof check === 'string' ? new RegExp(check) : check;
    }
  }
  const formats: Record<string, (value: string) => boolean> = {};
  for (const [name, re] of Object.entries(regexFormats)) {
    // `new Function` rather than a fat-arrow on purpose: ata serializes these format
    // checkers into the standalone bundle via Function#toString. A fat-arrow would
    // close over `re` and emit `re.test(value)`, leaving `re` undefined in the
    // generated module. Building it from a string inlines the regex literal into the
    // body, so the bundled output stays self-contained.
    // oxlint-disable-next-line no-new-func, no-implied-eval
    formats[name] = new Function('value', `return ${re.toString()}.test(value)`) as (value: string) => boolean;
  }

  const bundle = Validator.bundleStandalone(schemas, {
    format: 'cjs',
    verbose: ataOptionsOverrides.verbose !== false,
    formats,
  });

  const entries = keys
    .map((key, index) => `  ${JSON.stringify(key)}: wrap(validators[${index}], ${JSON.stringify(key)}),`)
    .join('\n');

  return [
    'const validators = (function () {',
    '  const module = { exports: {} };',
    bundle,
    '  return module.exports;',
    '})();',
    'function wrap(fn, key) {',
    '  function validate(data) {',
    "    if (typeof fn !== 'function') {",
    "      throw new Error('@rjsf/validator-ata: schema \"' + key + '\" was not compiled to a standalone validator');",
    '    }',
    '    const result = fn(data);',
    '    validate.errors = result.valid ? null : result.errors;',
    '    return result.valid;',
    '  }',
    '  return validate;',
    '}',
    'module.exports = {',
    entries,
    '};',
    '',
  ].join('\n');
}
