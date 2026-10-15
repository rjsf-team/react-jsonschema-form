import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ALL_OF_KEY, getByPath, ID_KEY, isObject, REF_KEY, getValidationSchemas } from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import type { CustomValidatorOptionsType } from './types.ts';

function decodeToken(token: string): string {
  return decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
}

/** Returns the `$id` that makes `value` a resource of its own, which the `#` fragment of a `$ref` below it is read
 * against. A draft-07 `$id` that is only a fragment names an anchor in the resource around it instead.
 */
function resourceIdOf(value: unknown): string | undefined {
  const id = isObject(value) ? value[ID_KEY] : undefined;
  return typeof id === 'string' && !id.startsWith('#') ? id : undefined;
}

/** Returns the subschema at the `$ref` fragment `ref` of `resource`, the resource itself for `#`, and the innermost
 * resource the path to it passes through, which the `$ref`s below the subschema are read against
 */
function locate(resource: unknown, ref: string): [unknown, unknown] {
  let node = resource;
  let base = resource;
  for (const token of ref.split('/').slice(1).map(decodeToken)) {
    if (resourceIdOf(node) !== undefined) {
      base = node;
    }
    node = getByPath(node, [token]);
  }
  return [node, base];
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

/** Returns `schema` as a document ata compiles on its own. ata names no subschema of another document, resolves a
 * `$ref` only to an entry of the `definitions` or `$defs` of the document it compiles, does not percent-decode it,
 * compiles nothing for a document holding both containers, and compiles nothing for one whose container holds an entry
 * carrying an `$id`. So every subschema of the root the document reaches through a `$ref`, a definition or not, is
 * carried in a single container of the document under a generated name the `$ref` is renamed to, without an `$id` of
 * its own, and the document's own containers, which only the renamed `$ref`s could name, are dropped. A `$ref` is read
 * against the innermost resource around it, an option with an `$id` of its own included, which is why a carried
 * subschema can go without its `$id`. One that names nothing there, or one into another document, is left as it is,
 * which leaves ata nothing to compile and the module reporting it when the schema is first validated against.
 *
 * @param schema - A schema `getValidationSchemas()` lists
 * @param rootSchema - The root it was listed for
 * @returns - The document
 */
function standalone(schema: GenericObjectType, rootSchema: object): GenericObjectType {
  const container = isObject(getByPath(rootSchema, ['$defs'])) ? '$defs' : 'definitions';
  const names = new Map<unknown, Map<string, string>>();
  const pending: [string, unknown, unknown][] = [];
  let count = 0;
  const renamed = (ref: string, base: unknown): string => {
    const [subschema, subschemaBase] = ref.startsWith('#') ? locate(base, ref) : [];
    if (subschema === undefined) {
      return ref;
    }
    const known = names.get(base) ?? new Map<string, string>();
    names.set(base, known);
    let name = known.get(ref);
    if (name === undefined) {
      name = `rjsf:${count}`;
      count += 1;
      known.set(ref, name);
      pending.push([name, subschema, subschemaBase]);
    }
    return `#/${container}/${name}`;
  };
  const rewrite = (value: unknown, base: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => rewrite(item, base));
    }
    if (!isObject(value)) {
      return value;
    }
    const inner = resourceIdOf(value) === undefined ? base : value;
    const copy = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child, inner)]));
    const ref: unknown = value[REF_KEY];
    if (typeof ref !== 'string') {
      return copy;
    }
    const { [REF_KEY]: _ref, ...siblings } = copy;
    const reference = { [REF_KEY]: renamed(ref, inner) };
    if (Object.keys(siblings).length === 0) {
      return reference;
    }
    // ata compiles no `$ref` beside keywords that assert something, so it is read as an `allOf` entry beside them, as
    // 2019-09, 2020-12 and Ajv read it
    const allOf: unknown = siblings[ALL_OF_KEY];
    return { ...siblings, [ALL_OF_KEY]: [...(Array.isArray(allOf) ? allOf : []), reference] };
  };
  const { definitions: _definitions, $defs: _defs, ...document } = compilable(rewrite(schema, rootSchema));
  const carried: GenericObjectType = {};
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [name, value, base] = next;
    const entry = compilable(rewrite(value, base));
    const { [ID_KEY]: _id, ...withoutId } = entry;
    carried[name] = resourceIdOf(entry) === undefined ? entry : withoutId;
  }
  return count === 0 ? document : { ...document, [container]: carried };
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
