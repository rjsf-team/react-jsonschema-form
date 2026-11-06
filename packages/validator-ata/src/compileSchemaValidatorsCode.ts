import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  ALL_OF_KEY,
  getByPath,
  ID_KEY,
  isObject,
  JSON_SCHEMA_DRAFT_2019_09,
  JSON_SCHEMA_DRAFT_2020_12,
  keywordShape,
  logOnce,
  normalizeUri,
  REF_KEY,
  resolveUri,
  rootSchemaIdOf,
  ROOT_SCHEMA_PREFIX,
  SCHEMA_KEY,
  getValidationSchemas,
} from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { ATA_CONFIG, COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import { isDraft04, ownId, schemaList } from './schemaList.ts';
import type { CustomValidatorOptionsType } from './types.ts';

/** Returns `text` percent-decoded, or undefined where it holds a `%` that starts no escape, which names nothing in the
 * root, as the schema graph reads such a `$ref`
 */
function percentDecoded(text: string): string | undefined {
  try {
    return decodeURIComponent(text);
  } catch {
    return undefined;
  }
}

/** Returns the value of the keyword `key` with each subschema it holds, by `keywordShape()`, replaced by what `map`
 * returns for it. Every other keyword, `const`, `enum`, `default` and `examples` among them, holds data a `$ref` key in
 * which is no reference.
 */
function mapKeyword(key: string, value: unknown, map: (subschema: unknown) => unknown): unknown {
  const shape = keywordShape(key, value);
  if (Array.isArray(value)) {
    return shape === 'array' ? value.map(map) : value;
  }
  if (!isObject(value)) {
    return value;
  }
  switch (shape) {
    case 'map':
      return Object.fromEntries(Object.entries(value).map(([name, subschema]) => [name, map(subschema)]));
    case 'single':
      return map(value);
    default:
      return value;
  }
}

/** The keywords no subschema of a compiled document keeps: an `$id`, and the containers of definitions, which only a
 * `$ref` names and ata would follow an alias in, every `$ref` read against them having been renamed to an entry
 * carried at the top of the document
 */
const DROPPED_KEYWORDS = new Set([ID_KEY, 'definitions', '$defs']);

/** The dialects in which an `$id` beside a `$ref` starts a resource, as the schema graph reads them */
const LATER_DIALECTS = new Set([JSON_SCHEMA_DRAFT_2019_09, JSON_SCHEMA_DRAFT_2020_12]);

/** The `$schema`s under which ata reads a schema as draft-07, as it spells them */
const DRAFT_07_IDS = new Set(['http://json-schema.org/draft-07/schema#', 'http://json-schema.org/draft-07/schema']);

/** Returns the subschemas `schema` holds under its keywords */
function subschemasOf(schema: GenericObjectType): unknown[] {
  const subschemas: unknown[] = [];
  for (const [key, value] of Object.entries(schema)) {
    mapKeyword(key, value, (subschema) => subschemas.push(subschema));
  }
  return subschemas;
}

/** Returns the `$id` that makes `value` a resource of its own, which the `#` fragment of a `$ref` below it is read
 * against. A draft-07 `$id` that is only a fragment names an anchor in the resource around it instead, and one beside a
 * `$ref` is ignored before 2019-09, as the schema graph the form reads the root through ignores it.
 */
function resourceIdOf(value: unknown, laterDialect: boolean): string | undefined {
  const id = isObject(value) ? value[ID_KEY] : undefined;
  const ignored = !laterDialect && isObject(value) && typeof value[REF_KEY] === 'string';
  return typeof id === 'string' && !id.startsWith('#') && !ignored ? id : undefined;
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
function resourceAt(value: unknown, base: string, laterDialect: boolean): Resource | undefined {
  const id = resourceIdOf(value, laterDialect);
  return id === undefined ? undefined : { schema: value, base: resolveUri(base, id) };
}

/** Returns the resource `rootSchema` is and every resource of it, by `documentKey()` of its base URI, the first found
 * where two share one. The root is also found under the id the runtime validator registers it under, as
 * `rootSchemaIdOf()` returns it, `__rjsf_rootSchema` for a root without an `$id`
 */
function resourcesOf(
  rootSchema: unknown,
  laterDialect: boolean,
): { id: string; root: Resource; resources: Map<string, Resource> } {
  const id = rootSchemaIdOf(rootSchema as RJSFSchema);
  const root: Resource = resourceAt(rootSchema, '', laterDialect) ?? { schema: rootSchema, base: '' };
  const resources = new Map<string, Resource>([[documentKey(id), root]]);
  const visit = (node: unknown, base: string) => {
    if (!isObject(node)) {
      return;
    }
    const resource = node === rootSchema ? root : resourceAt(node, base, laterDialect);
    if (resource !== undefined && !resources.has(documentKey(resource.base))) {
      resources.set(documentKey(resource.base), resource);
    }
    subschemasOf(node).forEach((subschema) => visit(subschema, resource?.base ?? base));
  };
  visit(rootSchema, root.base);
  return { id, root, resources };
}

/** Returns the resource of the root `ref` names and the fragment it names in it, `#` for the resource itself, reading
 * the document part of `ref` against the base URI of the resource around it as JSON Schema does, so that any spelling
 * of a resource's URI names it. The fragment is kept as written, since a lone surrogate it may hold has no URI
 * encoding.
 */
function referenced(
  ref: string,
  around: Resource,
  { id, resources }: Pick<RootReading, 'id' | 'resources'>,
): [Resource, string] | undefined {
  const [document, ...fragment] = ref.split('#');
  const found = (base: string) => resources.get(documentKey(resolveUri(base, document)));
  // Where the resolved URI names nothing, ata falls back to the `$ref` as written, which reaches the root only under
  // `__rjsf_rootSchema`, the id of a root without an `$id` of its own
  const asWritten = id === ROOT_SCHEMA_PREFIX && document === id;
  const resource = document === '' ? around : (found(around.base) ?? (asWritten ? found('') : undefined));
  return resource === undefined ? undefined : [resource, `#${fragment.join('#')}`];
}

/** Returns the subschema of `resource` carrying the anchor `name`, as an `$anchor` or as a draft-07 `$id` that is only
 * a fragment, looked for outside the resources nested in it, whose anchors are their own
 */
function anchored(resource: unknown, name: string, laterDialect: boolean): unknown {
  const visit = (node: unknown): unknown => {
    if (!isObject(node) || (node !== resource && resourceIdOf(node, laterDialect) !== undefined)) {
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

/** Where a step of a JSON pointer leaves it: at a subschema, at the array or map of subschemas a keyword holds, or in
 * data, which holds no subschema however deep the pointer goes
 */
type Position = 'schema' | 'list' | 'data';

/** Returns where the step `token` from a value at `position` leaves a JSON pointer, `child` being the value it reaches */
function stepFrom(position: Position, token: string, child: unknown): Position {
  if (position === 'list') {
    return 'schema';
  }
  if (position === 'data') {
    return 'data';
  }
  const shape = keywordShape(token, child);
  if (shape === 'array' || shape === 'map') {
    return 'list';
  }
  return shape === 'single' ? 'schema' : 'data';
}

/** Returns the subschema the `$ref` fragment `fragment` names in `resource`, the resource itself for `#`, and the
 * innermost resource the path to it passes through, which the `$ref`s below the subschema are read against. Only a
 * subschema on the path starts a resource, as the schema graph reads the root, never an object under a keyword holding
 * data, such as an OpenAPI `components` map
 */
function locate(resource: Resource, fragment: string, laterDialect: boolean): [unknown, Resource] {
  if (fragment !== '#' && !fragment.startsWith('#/')) {
    const name = percentDecoded(fragment.slice(1));
    return [name === undefined ? undefined : anchored(resource.schema, name, laterDialect), resource];
  }
  let node: unknown = resource.schema;
  let base = resource;
  let position: Position = 'schema';
  for (const encoded of fragment.split('/').slice(1)) {
    const token = percentDecoded(encoded)?.replaceAll('~1', '/').replaceAll('~0', '~');
    if (token === undefined) {
      return [undefined, base];
    }
    if (position === 'schema' && node !== resource.schema) {
      base = resourceAt(node, base.base, laterDialect) ?? base;
    }
    const child: unknown = getByPath(node, [token]);
    position = stepFrom(position, token, child);
    node = child;
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

/** What every document compiled for a root reads of it: the container its documents carry subschemas in, the
 * dialect it declares, which decides how ata reads the keywords of every subschema they carry, as it does where the
 * live validator resolves a pointer into the root, and its resources. A root is read once for all the schemas
 * `getValidationSchemas()` lists for it.
 */
interface RootReading {
  container: '$defs' | 'definitions';
  dialect: unknown;
  draft07: boolean;
  laterDialect: boolean;
  /** The id the runtime validator registers the root under, as `rootSchemaIdOf()` returns it */
  id: string;
  root: Resource;
  resources: ReadonlyMap<string, Resource>;
}

/** Returns the `RootReading` of `rootSchema` */
function readRoot(rootSchema: object): RootReading {
  const dialect: unknown = getByPath(rootSchema, [SCHEMA_KEY]);
  const laterDialect = typeof dialect === 'string' && LATER_DIALECTS.has(dialect.replace(/#$/, ''));
  return {
    container: isObject(getByPath(rootSchema, ['$defs'])) ? '$defs' : 'definitions',
    dialect,
    draft07: typeof dialect === 'string' && DRAFT_07_IDS.has(dialect),
    laterDialect,
    ...resourcesOf(rootSchema, laterDialect),
  };
}

/** Returns `schema` as a document ata compiles on its own. ata names no subschema of another document, resolves a
 * `$ref` only to an entry of the `definitions` or `$defs` of the document it compiles, does not percent-decode it,
 * compiles nothing for a document holding both containers, and compiles nothing for one holding a subschema that
 * carries an `$id` of its own.
 *
 * So every subschema of the root the document reaches through a `$ref`, a definition, an anchor or neither, is
 * carried in a single container of the document under a generated name the `$ref` is renamed to. A `$ref` is read
 * against the innermost resource around it, an option with an `$id` of its own included, as the schema graph reads the
 * root's resources: its document part is resolved against that resource's base URI and names whichever resource of the
 * root has that URI, however it is spelled. One into another document is left as it is, for ata to resolve against the
 * extra schemas compiled into the module beside it. One that names nothing there or in them leaves ata nothing to
 * compile and the module reporting it when the schema is first validated against. No subschema of the document keeps
 * an `$id` or a container, which only the renamed `$ref`s could need. Only the keywords holding subschemas are
 * rewritten, never the data a `const` or a `default` holds.
 *
 * @param schema - A schema `getValidationSchemas()` lists, or a subschema of the root
 * @param reading - The `RootReading` of the root it was listed for
 * @param [start=reading.root] - The resource of the root the `$ref`s of `schema` are read against
 * @returns - The document
 */
function standalone(
  schema: unknown,
  { container, dialect, draft07, laterDialect, id, root, resources }: RootReading,
  start: Resource = root,
): GenericObjectType {
  const names = new Map<unknown, Map<string, string>>();
  const pending: [string, unknown, Resource][] = [];
  let count = 0;
  const renamed = (ref: string, around: Resource): string => {
    const target = referenced(ref, around, { id, resources });
    if (target === undefined) {
      return ref;
    }
    const [resource, fragment] = target;
    const [subschema, subschemaBase] = locate(resource, fragment, laterDialect);
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
    const resource = value === around.schema ? undefined : resourceAt(value, around.base, laterDialect);
    const inner = resource ?? around;
    const copy = Object.fromEntries(
      Object.entries(value).flatMap(([key, child]) =>
        DROPPED_KEYWORDS.has(key) ? [] : [[key, mapKeyword(key, child, (sub) => rewrite(sub, inner))]],
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
    // Under draft-07 ata ignores what asserts beside a `$ref`, as that draft does, once it has read the `$ref` beside it
    if (draft07) {
      return { ...siblings, ...reference };
    }
    // ata compiles no `$ref` beside keywords that assert something, so it is read as an `allOf` entry beside them, as
    // 2019-09, 2020-12 and Ajv read it
    const allOf: unknown = siblings[ALL_OF_KEY];
    return { ...siblings, [ALL_OF_KEY]: [...(Array.isArray(allOf) ? allOf : []), reference] };
  };
  const document = compilable(rewrite(schema, start));
  const carried: GenericObjectType = {};
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [name, value, base] = next;
    carried[name] = compilable(rewrite(value, base));
  }
  const declared = typeof dialect === 'string' ? { [SCHEMA_KEY]: dialect, ...document } : document;
  return count === 0 ? declared : { ...declared, [container]: carried };
}

/** Returns the `$id` of `schema` and of every subschema in it */
function idsIn(schema: unknown): unknown[] {
  return isObject(schema) ? [schema[ID_KEY], ...subschemasOf(schema).flatMap(idsIn)] : [];
}

/** The extras found to hold no `$ref` into each root, kept so compiling on every request walks each of them once. An
 * extra or root changed in place after a compile keeps the answer it had then
 */
const UNLINKED = new WeakMap<object, WeakSet<object>>();

/** Returns the extra schema `extra`, registered under `id`, with every `$ref` it holds into the form's document or into
 * a resource of the root renamed to the `$id` of a document of its own compiled by `standalone()` from the subschema it
 * names, under an `$id` `targetId()` returns. The module compiles no copy of the root a pointer into it could reach, so
 * without this such a `$ref` names nothing there and holds for any data. Each document is added to `targets` under the
 * subschema it is compiled from, so a subschema several `$ref`s name is compiled once. A `$ref` to the whole root is
 * renamed to the `$id` the module compiles the root under instead, where the root's own `$id` is that.
 */
function linkedToForm(
  extra: object,
  id: string,
  reading: RootReading,
  targets: Map<unknown, GenericObjectType>,
  targetId: () => string,
): object {
  const root = reading.root.schema as object;
  const unlinked = UNLINKED.get(root) ?? new WeakSet<object>();
  UNLINKED.set(root, unlinked);
  if (unlinked.has(extra)) {
    return extra;
  }
  let isLinked = false;
  const targetOf = (ref: string, base: string): string => {
    const [document] = ref.split('#', 1);
    const named = document === '' ? undefined : referenced(ref, { schema: extra, base }, reading);
    if (named === undefined) {
      return ref;
    }
    const [resource, fragment] = named;
    if (resource === reading.root && fragment === '#' && getByPath(resource.schema, [ID_KEY]) === reading.id) {
      isLinked = true;
      return reading.id;
    }
    const [subschema, around] = locate(resource, fragment, reading.laterDialect);
    if (subschema === undefined) {
      return ref;
    }
    const target = targets.get(subschema) ?? {
      ...standalone(subschema, reading, around),
      [ID_KEY]: targetId(),
    };
    targets.set(subschema, target);
    isLinked = true;
    return target[ID_KEY] as string;
  };
  // ata reads the `$id`s of an extra that declares a `$schema` by that dialect, not by the form's
  const dialect: unknown = getByPath(extra, [SCHEMA_KEY]);
  const laterDialect =
    typeof dialect === 'string' ? LATER_DIALECTS.has(dialect.replace(/#$/, '')) : reading.laterDialect;
  const link = (value: unknown, base: string): unknown => {
    if (!isObject(value)) {
      return value;
    }
    const inner = value === extra ? base : (resourceAt(value, base, laterDialect)?.base ?? base);
    const copy = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, mapKeyword(key, child, (sub) => link(sub, inner))]),
    );
    const ref: unknown = value[REF_KEY];
    return typeof ref === 'string' ? { ...copy, [REF_KEY]: targetOf(ref, inner) } : copy;
  };
  const linked = link(extra, id) as object;
  if (!isLinked) {
    unlinked.add(extra);
  }
  return linked;
}

/** The size of each extra schema a warning has given, kept so compiling on every request serializes it once */
const SIZES = new WeakMap<object, string>();

/** Returns the size of the JSON of `extra`, for a warning */
function sizeOf(extra: object): string {
  let size = SIZES.get(extra);
  if (size === undefined) {
    const bytes = new TextEncoder().encode(JSON.stringify(extra)).length;
    size = bytes < 1024 ? `${bytes} bytes` : `about ${Math.round(bytes / 1024)} KB`;
    SIZES.set(extra, size);
  }
  return size;
}

/** Compiles a schema into a precompiled validator module. ata's
 * `bundleStandalone` emits `module.exports = [fn, ...]`, one validator per
 * schema in order, where each `fn(data)` returns `{ valid, errors }`. This wraps
 * that array into the `{ [id]: (data) => boolean }`-with-`errors` map that
 * `createPrecompiledValidator` consumes, keyed the same way `getValidationSchemas()` keys
 * the schemas so the precompiled validator can look each one up.
 *
 * `customFormats` (as RegExps or pattern strings) and `ataOptionsOverrides` are passed to
 * ata. `additionalMetaSchemas` and `ataOptionsOverrides.schemas` are compiled into the module
 * under the `$id` ata registers each by, as the runtime validator ends up with them (a later one
 * replacing an earlier one with the same `$id`), so a custom meta-schema named in `$schema`
 * applies there too. A json-schema.org meta-schema passed in is compiled in as well, with a
 * warning giving its size, since ata ships the official draft-04 to 2020-12 ones.
 * Extra schemas without an `$id` are left out with a warning, as ata requires one.
 * A few options cannot be carried into a standalone module: `extenderFn` and the
 * `ataOptionsOverrides` keys `coerceTypes`, `removeAdditional` and `keywords`. Those are left
 * out with a warning, since the module and the runtime validator may then disagree in either
 * direction. The module also never fills in `default` values, so where the runtime validator
 * would fill a missing required field from its default, the module rejects it.
 * `suppressDuplicateFiltering` is given to `createPrecompiledValidator()` instead, and passing it
 * here only warns. Each of these warnings goes through `logOnce()`, so compiling on every
 * request logs it once.
 *
 * @param schema - The schema to compile
 * @param [options={}] - The `CustomValidatorOptionsType` to compile with: the options used to build the validator
 */
export function compileSchemaValidatorsCode<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  options: CustomValidatorOptionsType = {},
) {
  const { customFormats, additionalMetaSchemas = [], extenderFn, ataOptionsOverrides = {} } = options;
  const schemaMaps = getValidationSchemas(schema);
  const keys = Object.keys(schemaMaps);
  const reading = readRoot(schema);
  const schemas = Object.entries(schemaMaps).map(([key, listed]) => {
    const { [ID_KEY]: _id, ...withoutId } = listed;
    return { ...standalone(withoutId, reading), [ID_KEY]: key };
  });

  // What the module cannot carry is left out. `engine` only picks how the runtime validator
  // answers, never what it answers, and a standalone module is generated code by definition.
  const {
    coerceTypes,
    removeAdditional,
    keywords,
    schemas: extraSchemas,
    engine: _engine,
    ...carried
  } = ataOptionsOverrides;
  // Extra schemas go into the bundle after the form's own schemas, so a custom meta-schema or a
  // `$ref` between them resolves there too. They get no entry in the exported map. Every document
  // the runtime validator ends up with goes in: `ataOptionsOverrides.schemas`, as the list the
  // runtime validators get (see `schemaList`), and then `additionalMetaSchemas` (through
  // `addSchema`, which needs a plain `$id`), each under the `$id` a `$ref` reaches it by, a later
  // one replacing an earlier one with the same `$id`. One with the `$id` of one of the form's own
  // schemas, or the one the runtime validator registers the root under, is left out: at runtime the
  // form's schema wins. A record entry under the empty key is left out, as at runtime. A `$ref` an
  // extra holds into the form's document is read against the root, see `linkedToForm()`.
  const formIds = new Set([...keys, reading.id]);
  const extras = [...schemaList(extraSchemas, isDraft04(schema, false)), ...additionalMetaSchemas].map(
    (extra) => [extra !== null && typeof extra === 'object' ? ownId(extra) : undefined, extra] as const,
  );
  const winners = new Map<string, object>();
  for (const [id, extra] of extras) {
    if (id !== undefined && !formIds.has(id)) {
      winners.set(id, extra);
    }
  }
  const targets = new Map<unknown, GenericObjectType>();
  let targetCount = 0;
  // An extra's nested `$id`s are registered in the module too; read only once a target is needed
  let taken: Set<unknown> | undefined;
  const targetId = (): string => {
    taken ??= new Set([...formIds, ...[...winners.values()].flatMap(idsIn)]);
    let id: string;
    do {
      id = `urn:rjsf:form-target:${targetCount}`;
      targetCount += 1;
    } while (taken.has(id));
    return id;
  };
  const bundled = [...winners].map(([id, extra]) => linkedToForm(extra, id, reading, targets, targetId));
  for (const [id, extra] of winners) {
    if (/^https?:\/\/json-schema\.org\//.test(id)) {
      logOnce(
        `@rjsf/validator-ata: ${id} is compiled into the precompiled module (${sizeOf(extra)} of JSON). ata ships its own copies of the draft-04, draft-06, draft-07, 2019-09 and 2020-12 meta-schemas, so an unchanged copy of one of those does not need to be passed`,
      );
    }
  }
  // One with only a fragment `$id` is left out without a warning: no `$ref` reaches it at runtime.
  const unnamed = (extra: unknown) => {
    const id = extra !== null && typeof extra === 'object' ? (extra as { $id?: unknown }).$id : undefined;
    return typeof id !== 'string' || id === '';
  };
  if (extras.some(([id, extra]) => id === undefined && unnamed(extra))) {
    logOnce(
      '@rjsf/validator-ata: additionalMetaSchemas and ataOptionsOverrides.schemas entries without an $id are left out of the precompiled module; ata needs an $id to register one, so the runtime validator rejects them too',
    );
  }
  const dropped = [
    ...(extenderFn ? ['extenderFn'] : []),
    ...(coerceTypes ? ['ataOptionsOverrides.coerceTypes'] : []),
    ...(removeAdditional ? ['ataOptionsOverrides.removeAdditional'] : []),
    ...(keywords && Object.keys(keywords).length ? ['ataOptionsOverrides.keywords'] : []),
  ];
  if (dropped.length > 0) {
    logOnce(
      `@rjsf/validator-ata: ${dropped.join(', ')} cannot be carried into a precompiled validator and ${dropped.length === 1 ? 'is' : 'are'} ignored; the precompiled and runtime validators may disagree`,
    );
  }
  if (options.suppressDuplicateFiltering !== undefined) {
    logOnce(
      '@rjsf/validator-ata: suppressDuplicateFiltering has no effect at compile time; pass it to createPrecompiledValidator() instead',
    );
  }

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

  const bundle = Validator.bundleStandalone([...schemas, ...bundled, ...targets.values()], {
    ...ATA_CONFIG,
    ...carried,
    format: 'cjs',
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
