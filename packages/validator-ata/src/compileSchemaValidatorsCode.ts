import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ALL_OF_KEY, getByPath, ID_KEY, isObject, REF_KEY, getValidationSchemas } from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import type { CustomValidatorOptionsType } from './types.ts';

/** A `$ref` naming a whole entry of the root's `definitions` or `$defs`, the only `$ref` ata resolves, and only to an
 * entry of the document it compiles
 */
const DEFINITION_REF = /^#\/(definitions|\$defs)\/([^/]*)$/;

function decodeToken(token: string): string {
  return decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
}

/** Returns the subschema at the `$ref` fragment `ref` of `root`, the root itself for `#` */
function subschemaAt(root: unknown, ref: string): unknown {
  const tokens = ref.split('/').slice(1).map(decodeToken);
  return tokens.length === 0 ? root : getByPath(root, tokens);
}

/** Returns `schema` as an object schema asserting what it says, since ata compiles no boolean schema, and no schema
 * holding no assertion it knows, such as `{ title: 'By email' }`. A `not` is an assertion it knows, so one that always
 * holds is added where the schema has none, unless it holds a `$ref`, which ata compiles only on its own.
 */
function compilable(schema: unknown): GenericObjectType {
  if (schema === false) {
    return { not: {} };
  }
  const object = isObject(schema) ? schema : {};
  return 'not' in object || REF_KEY in object ? object : { ...object, not: { not: {} } };
}

/** Returns `schema` as a document ata compiles on its own. ata names no subschema of another document and resolves a
 * `$ref` only to an entry of the `definitions` or `$defs` of the document it compiles, so the document carries every
 * definition of the root it reaches, and every other subschema of the root it reaches through a `$ref` as a
 * definition of its own, the `$ref` renamed to it. A `$ref` that names nothing in the root, or one into another
 * document, is left as it is, which leaves ata nothing to compile and the module reporting it when the schema is first
 * validated against.
 *
 * @param schema - A schema `getValidationSchemas()` lists
 * @param rootSchema - The root it was listed for
 * @returns - The document
 */
function standalone(schema: GenericObjectType, rootSchema: object): GenericObjectType {
  // ata resolves a `$ref` into one of the two containers of a document only, so the subschemas are carried in the one
  // the root uses
  const synthetic = isObject(getByPath(rootSchema, ['$defs'])) ? '$defs' : 'definitions';
  const taken = new Set([
    ...Object.keys(getByPath<object>(rootSchema, [synthetic], {})),
    ...Object.keys(getByPath<object>(schema, [synthetic], {})),
  ]);
  const names = new Map<string, string>();
  const carried = new Set<string>();
  const pending: [string, string, unknown][] = [];
  const carry = (container: string, name: string, value: unknown) => {
    const key = `${container}/${name}`;
    if (!carried.has(key)) {
      carried.add(key);
      pending.push([container, name, value]);
    }
  };
  const nameFor = (target: string, value: unknown) => {
    const known = names.get(target);
    if (known !== undefined) {
      return known;
    }
    let name = `rjsf:${names.size}`;
    while (taken.has(name)) {
      name += '_';
    }
    names.set(target, name);
    carry(synthetic, name, value);
    return name;
  };
  const renamed = (ref: string): string => {
    if (!ref.startsWith('#')) {
      return ref;
    }
    const [, container, token] = DEFINITION_REF.exec(ref) ?? [];
    if (container !== undefined) {
      const name = decodeToken(token);
      const definition = getByPath(rootSchema, [container, name]);
      if (definition !== undefined) {
        carry(container, name, definition);
      }
      return ref;
    }
    const subschema = subschemaAt(rootSchema, ref);
    return subschema === undefined ? ref : `#/${synthetic}/${nameFor(ref, subschema)}`;
  };
  const rewrite = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(rewrite);
    }
    if (!isObject(value)) {
      return value;
    }
    const copy = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]));
    const ref: unknown = value[REF_KEY];
    if (typeof ref !== 'string') {
      return copy;
    }
    const { [REF_KEY]: _ref, ...siblings } = copy;
    const reference = { [REF_KEY]: renamed(ref) };
    if (Object.keys(siblings).length === 0) {
      return reference;
    }
    // ata compiles no `$ref` beside keywords that assert something, so it is read as an `allOf` entry beside them, as
    // 2019-09, 2020-12 and Ajv read it
    const allOf: unknown = siblings[ALL_OF_KEY];
    return { ...siblings, [ALL_OF_KEY]: [...(Array.isArray(allOf) ? allOf : []), reference] };
  };
  const document = compilable(rewrite(schema));
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [container, name, value] = next;
    const entries: unknown = document[container];
    document[container] = { ...(isObject(entries) ? entries : {}), [name]: compilable(rewrite(value)) };
  }
  return document;
}

/** Compiles a schema into a precompiled validator module. ata's
 * `bundleStandalone` emits `module.exports = [fn, ...]`, one validator per
 * schema in order, where each `fn(data)` returns `{ valid, errors }`. This wraps
 * that array into the `{ [id]: (data) => boolean }`-with-`errors` map that
 * `createPrecompiledValidator` consumes, keyed the same way `getValidationSchemas()` keys
 * the schemas so the precompiled validator can look each one up.
 *
 * @param schema - The schema to compile
 * @param [options={}] - The `CustomValidatorOptionsType` to compile with: the options used to build the validator
 */
export function compileSchemaValidatorsCode<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  options: CustomValidatorOptionsType = {},
) {
  const { customFormats, ataOptionsOverrides = {} } = options;
  const schemaMaps = getValidationSchemas(schema);
  const keys = Object.keys(schemaMaps);
  const schemas = Object.entries(schemaMaps).map(([key, listed]) => {
    const { [ID_KEY]: _id, ...withoutId } = listed;
    return { ...standalone(withoutId, schema), [ID_KEY]: key };
  });

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
