import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  ALL_OF_KEY,
  getByPath,
  ID_KEY,
  isObject,
  normalizeUri,
  REF_KEY,
  resolveUri,
  SCHEMA_KEY,
  getValidationSchemas,
} from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import type { CustomValidatorOptionsType } from './types.ts';

function decodeToken(token: string): string {
  return decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
}

/** The keywords whose values hold subschemas, by the shape of the value: one subschema, an array of them, or a map of
 * names, which are data, to them. Every other keyword, `const`, `enum`, `default` and `examples` among them, holds data
 * a `$ref` key in which is no reference.
 */
const SUBSCHEMA_KEYWORDS = new Set([
  'items',
  'additionalItems',
  'additionalProperties',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'unevaluatedItems',
  'unevaluatedProperties',
  'contentSchema',
]);
const SUBSCHEMA_ARRAY_KEYWORDS = new Set(['items', 'prefixItems', ALL_OF_KEY, 'anyOf', 'oneOf']);
const SUBSCHEMA_MAP_KEYWORDS = new Set([
  'properties',
  'patternProperties',
  'definitions',
  '$defs',
  'dependentSchemas',
  'dependencies',
]);

/** Returns the value of the keyword `key` with each subschema it holds replaced by what `map` returns for it */
function mapKeyword(key: string, value: unknown, map: (subschema: unknown) => unknown): unknown {
  if (SUBSCHEMA_ARRAY_KEYWORDS.has(key) && Array.isArray(value)) {
    return value.map(map);
  }
  if (SUBSCHEMA_MAP_KEYWORDS.has(key) && isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([name, subschema]) => [name, map(subschema)]));
  }
  return SUBSCHEMA_KEYWORDS.has(key) ? map(value) : value;
}

/** Returns the subschemas `schema` holds under its keywords */
function subschemasOf(schema: GenericObjectType): unknown[] {
  const subschemas: unknown[] = [];
  for (const [key, value] of Object.entries(schema)) {
    mapKeyword(key, value, (subschema) => subschemas.push(subschema));
  }
  return subschemas;
}

/** Returns the `$id` that makes `value` a resource of its own, which the `#` fragment of a `$ref` below it is read
 * against. A draft-07 `$id` that is only a fragment names an anchor in the resource around it instead.
 */
function resourceIdOf(value: unknown): string | undefined {
  const id = isObject(value) ? value[ID_KEY] : undefined;
  return typeof id === 'string' && !id.startsWith('#') ? id : undefined;
}

/** A resource of the root, a subschema the root is or that carries an `$id` making it one, with the base URI the
 * `$ref`s below it are read against
 */
interface Resource {
  readonly schema: unknown;
  readonly base: string;
}

/** Returns the URI `uri` names its document by, for comparing it with another: what precedes its fragment, normalized
 * as the schema graph normalizes it
 */
function documentKey(uri: string): string {
  return normalizeUri(uri.split('#', 1)[0]);
}

/** Returns the resource `value` is under the base URI `base` of the one around it: itself where it carries an `$id`
 * making it one, or undefined
 */
function resourceAt(value: unknown, base: string): Resource | undefined {
  const id = resourceIdOf(value);
  return id === undefined ? undefined : { schema: value, base: resolveUri(base, id) };
}

/** Returns the resource `rootSchema` is and every resource of it, by `documentKey()` of its base URI, the first found
 * where two share one
 */
function resourcesOf(rootSchema: unknown): { root: Resource; resources: Map<string, Resource> } {
  const root: Resource = resourceAt(rootSchema, '') ?? { schema: rootSchema, base: '' };
  const resources = new Map<string, Resource>([[documentKey(root.base), root]]);
  const visit = (node: unknown, base: string) => {
    if (!isObject(node)) {
      return;
    }
    const resource = node === rootSchema ? root : resourceAt(node, base);
    if (resource !== undefined && !resources.has(documentKey(resource.base))) {
      resources.set(documentKey(resource.base), resource);
    }
    subschemasOf(node).forEach((subschema) => visit(subschema, resource?.base ?? base));
  };
  visit(rootSchema, root.base);
  return { root, resources };
}

/** Returns the resource of the root `ref` names and the fragment it names in it, `#` for the resource itself, reading
 * the document part of `ref` against the base URI of the resource around it as JSON Schema does, so that any spelling
 * of a resource's URI names it. The fragment is kept as written, since a lone surrogate it may hold has no URI
 * encoding.
 */
function referenced(
  ref: string,
  around: Resource,
  resources: ReadonlyMap<string, Resource>,
): [Resource, string] | undefined {
  const [document, ...fragment] = ref.split('#');
  const resource = document === '' ? around : resources.get(documentKey(resolveUri(around.base, document)));
  return resource === undefined ? undefined : [resource, `#${fragment.join('#')}`];
}

/** Returns the subschema of `resource` carrying the anchor `name`, as an `$anchor` or as a draft-07 `$id` that is only
 * a fragment, looked for outside the resources nested in it, whose anchors are their own
 */
function anchored(resource: unknown, name: string): unknown {
  const visit = (node: unknown): unknown => {
    if (!isObject(node) || (node !== resource && resourceIdOf(node) !== undefined)) {
      return undefined;
    }
    if (node.$anchor === name || node[ID_KEY] === `#${name}`) {
      return node;
    }
    for (const subschema of subschemasOf(node)) {
      const found = visit(subschema);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  };
  return visit(resource);
}

/** Returns the subschema the `$ref` fragment `fragment` names in `resource`, the resource itself for `#`, and the
 * innermost resource the path to it passes through, which the `$ref`s below the subschema are read against
 */
function locate(resource: Resource, fragment: string): [unknown, Resource] {
  if (fragment !== '#' && !fragment.startsWith('#/')) {
    return [anchored(resource.schema, decodeURIComponent(fragment.slice(1))), resource];
  }
  let node = resource.schema;
  let base = resource;
  for (const token of fragment.split('/').slice(1).map(decodeToken)) {
    if (node !== resource.schema) {
      base = resourceAt(node, base.base) ?? base;
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
 * compiles nothing for a document holding both containers, and compiles nothing for one holding a subschema that
 * carries an `$id` of its own. So every subschema of the root the document reaches through a `$ref`, a definition, an
 * anchor or neither, is carried in a single container of the document under a generated name the `$ref` is renamed
 * to, and the document's own containers, which only the renamed `$ref`s could name, are dropped. A `$ref` is read
 * against the innermost resource around it, an option with an `$id` of its own included, whose `$id` is then dropped,
 * every `$ref` read against it having been renamed: its document part is resolved against that resource's base URI and
 * names whichever resource of the root has that URI, however it is spelled. One that names nothing there, or one into
 * another document, is
 * left as it is, which leaves ata nothing to compile and the module reporting it when the schema is first validated
 * against. Only the keywords holding subschemas are rewritten, never the data a `const` or a `default` holds.
 *
 * @param schema - A schema `getValidationSchemas()` lists
 * @param rootSchema - The root it was listed for
 * @returns - The document
 */
function standalone(schema: GenericObjectType, rootSchema: object): GenericObjectType {
  const container = isObject(getByPath(rootSchema, ['$defs'])) ? '$defs' : 'definitions';
  const { root, resources } = resourcesOf(rootSchema);
  const names = new Map<unknown, Map<string, string>>();
  const pending: [string, unknown, Resource][] = [];
  let count = 0;
  const renamed = (ref: string, around: Resource): string => {
    const target = referenced(ref, around, resources);
    if (target === undefined) {
      return ref;
    }
    const [resource, fragment] = target;
    const [subschema, subschemaBase] = locate(resource, fragment);
    if (subschema === undefined) {
      return ref;
    }
    const known = names.get(resource.schema) ?? new Map<string, string>();
    names.set(resource.schema, known);
    let name = known.get(fragment);
    if (name === undefined) {
      name = `rjsf:${count}`;
      count += 1;
      known.set(fragment, name);
      pending.push([name, subschema, subschemaBase]);
    }
    return `#/${container}/${name}`;
  };
  const rewrite = (value: unknown, around: Resource): unknown => {
    if (!isObject(value)) {
      return value;
    }
    const resource = value === around.schema ? undefined : resourceAt(value, around.base);
    const inner = resource ?? around;
    const copy = Object.fromEntries(
      Object.entries(value).flatMap(([key, child]) =>
        key === ID_KEY && inner.schema === value ? [] : [[key, mapKeyword(key, child, (sub) => rewrite(sub, inner))]],
      ),
    );
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
  const { definitions: _definitions, $defs: _defs, ...document } = compilable(rewrite(schema, root));
  const carried: GenericObjectType = {};
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [name, value, base] = next;
    carried[name] = compilable(rewrite(value, base));
  }
  // The dialect the root declares decides how ata reads the keywords of every subschema it carries, as it does where the
  // live validator resolves a pointer into the root
  const dialect: unknown = getByPath(rootSchema, [SCHEMA_KEY]);
  const declared = typeof dialect === 'string' ? { [SCHEMA_KEY]: dialect, ...document } : document;
  return count === 0 ? declared : { ...declared, [container]: carried };
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
