import {
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONTAINS_KEY,
  DEFINITIONS_KEY,
  DEPENDENCIES_KEY,
  DEPENDENT_SCHEMAS_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  UNEVALUATED_ITEMS_KEY,
  UNEVALUATED_PROPERTIES_KEY,
} from './constants.ts';
import deepEquals from './deepEquals.ts';
import getFieldSchemaPath from './getFieldSchemaPath.ts';
import getKeywordParentSchema, { keywordParentSchemaAt } from './getKeywordParentSchema.ts';
import getUiOptions from './getUiOptions.ts';
import isObject from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import parseSchemaGraph, { childPointer, stringKeyword, unescapeToken } from './schema/graph/parseSchemaGraph.ts';
import type { ObjectNode } from './schema/graph/parseSchemaGraph.ts';
import { resolveOwnRef } from './schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** What `applyValidatorErrorTitles()` reads of an error a validator package reports */
export interface ValidatorErrorTitleSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The engine's message, which names each of the `names` between a pair of `quote`s */
  message: string;
  /** The names of the properties the message names */
  names: string[];
  /** The quote the engine puts around a property name */
  quote: "'" | '"';
  /** The error's property path, dot-separated as RJSF writes it, `''` for the root */
  property: string;
  /** The URI fragment of the JSON Pointer to the schema keyword that failed, such as `#/properties/a/required` */
  schemaPath: string;
  /** Decodes a key of the `schemaPath`, for an engine that escapes them; they are read as written without it */
  decodeSchemaPathKey?: (key: string) => string;
  /** The engine leaves every `$ref` out of the `schemaPath`, as `getKeywordParentSchema()`'s `skipsRefs` reads it */
  skipsRefs?: boolean;
  /** The form's uiSchema */
  uiSchema?: UiSchema<T, S, F>;
  /** The schema object that holds the keyword that failed, when the engine hands it over */
  parentSchema?: unknown;
  /** The form's root schema */
  schema?: S;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const INSTANCE_STEP_KEYS = new Set([
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  ITEMS_KEY,
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  CONTAINS_KEY,
  UNEVALUATED_ITEMS_KEY,
  UNEVALUATED_PROPERTIES_KEY,
]);
const NAMED_KEYS = new Set([
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
  DEPENDENT_SCHEMAS_KEY,
  DEPENDENCIES_KEY,
  '$defs',
  DEFINITIONS_KEY,
]);

const ITEM_STEP_KEYS = new Set([
  PREFIX_ITEMS_KEY,
  ITEMS_KEY,
  ADDITIONAL_ITEMS_KEY,
  CONTAINS_KEY,
  UNEVALUATED_ITEMS_KEY,
]);

/** The ends of the matches a schema path's instance step can make of an error's `property` from its index `at` */
type InstanceStep = (property: string, at: number) => number[];
// Every step after one starts at a `.`, so only the ends of keys are kept
const keyEnds = (property: string, start: number) =>
  Array.from({ length: property.length - start + 1 }, (_, i) => start + i).filter(
    (end) => end === property.length || property[end] === '.',
  );
// An `additionalProperties` or other such step stands for any key, which can hold a `.`
const anyKey: InstanceStep = (property, at) => (property[at] === '.' ? keyEnds(property, at + 2) : []);
const ITEM_INDEX = /\.\d+(?=\.|$)/y;
const anyIndex: InstanceStep = (property, at) => {
  ITEM_INDEX.lastIndex = at;
  return ITEM_INDEX.test(property) ? [ITEM_INDEX.lastIndex] : [];
};
const anywhere: InstanceStep = (property, at) => keyEnds(property, at);
const namedKey =
  (key: string): InstanceStep =>
  (property, at) =>
    property.startsWith(`.${key}`, at) ? [at + key.length + 1] : [];

/** Whether the instance a schema path's `keys` lead to from the root is the one at `property`: a `properties` step names
 * its key, an `items` or other such step stands for any index, and an `additionalProperties` or other such step for any
 * key. A schema a `$ref` names other than the root, such as a definition, is reached from anywhere, so a path into one
 * only has to end at the `property`. The root a recursive `$ref: '#'` names is reached again where each such `$ref`
 * sits, any number of times. The steps are matched as the set of indexes of `property` they reach, so a schema naming
 * its root from places that overlap, which a regular expression would backtrack through exponentially, costs no more
 * than one that names it once
 *
 * @param keys - The decoded keys of the path from the root to the schema holding the keyword
 * @param property - The error's property path, as `applyValidatorErrorTitles()` takes it
 * @param schema - The form's root schema
 * @returns - Whether the path leads to the instance at `property`
 */
function leadsToProperty<S extends StrictRJSFSchema>(keys: string[], property: string, schema: S): boolean {
  const graph = parseSchemaGraph<S>(schema);
  const nodes = Array.from({ length: graph.size }, (_, id) => graph.node(id) as ObjectNode<S>);
  // The JSON pointers the `$ref`s name
  const refTargets = new Set(nodes.map((node) => node.refPointer));
  const stepsOf = (path: string[]) => {
    let steps: InstanceStep[] = [];
    for (let index = 0; index < path.length; index++) {
      const key = path[index];
      if (key === PROPERTIES_KEY) {
        steps.push(namedKey(path[index + 1]));
      } else if (INSTANCE_STEP_KEYS.has(key)) {
        steps.push(ITEM_STEP_KEYS.has(key) ? anyIndex : anyKey);
      }
      // The next key is a name or an index, never a keyword
      if (NAMED_KEYS.has(key) || (key === ITEMS_KEY && /^\d+$/.test(path[index + 1]))) {
        index += 1;
      }
      if (refTargets.has(childPointer('', path.slice(0, index + 1)))) {
        steps = [anywhere];
      }
    }
    return steps;
  };
  const follow = (ats: number[], steps: InstanceStep[]) =>
    steps.reduce((from, step) => [...new Set(from.flatMap((at) => step(property, at)))], ats);
  const repeats = nodes
    .filter((node) => node.refPointer === '')
    .map((node) => stepsOf(node.pointer.split('/').slice(1).map(unescapeToken)));
  // A `Set` iterates the indexes added while it is iterated, so this runs until the repeats reach no new one
  const reached = new Set([0]);
  for (const at of reached) {
    repeats.forEach((steps) => follow([at], steps).forEach((end) => reached.add(end)));
  }
  return follow([...reached], stepsOf(keys)).includes(property.length);
}

/** Used by the validator packages to name the properties an error's message names by their `ui:title` or `title`.
 * A name's title is its `ui:title` at the error's `property`, then at it with each array index read as `items`, then,
 * unless the root leads along the `schemaPath` to no schema at the `property`, at the `schemaPath`, then at it with the
 * branches the keyword sits in removed (see `getFieldSchemaPath()`), then the `title` the uiSchema holds at the
 * `property`, then the `title` of its schema in the `parentSchema`, then in the schema of the field holding the branch
 * the keyword sits in, then in the root `schema`. A schema that is a `$ref` is read resolved, its own `title` kept over
 * its target's and read where its `$ref` can't be merged. Each name with a title is replaced, in one pass so a title
 * that matches another name isn't replaced again, by its title in single quotes. The title is written as it is, `$`
 * patterns included.
 *
 * @param source - The error's message and what its names' titles are looked up in
 * @returns - The `message` with each name that has a title replaced by it, and the title of each such name
 */
export default function applyValidatorErrorTitles<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  message,
  names,
  quote,
  property,
  schemaPath,
  decodeSchemaPathKey = (key) => key,
  skipsRefs = false,
  uiSchema,
  parentSchema,
  schema,
}: ValidatorErrorTitleSource<T, S, F>): { message: string; titles: Map<string, string> } {
  const propParts = property.replace(/^\./, '').split('.').filter(Boolean);
  // An array item's uiSchema is its array's `items`, whichever way the engine writes a `$ref` into the path
  const itemParts = propParts.map((part) => (/^\d+$/.test(part) ? ITEMS_KEY : part));
  // `#/properties/A/properties/B/required` points into the uiSchema at `['A', 'B']`
  const uiSchemaPathParts = (path: string) =>
    path
      .replace(/\/properties\//g, '/')
      .split('/')
      .slice(1, -1)
      .map(decodeSchemaPathKey);
  const schemaPathParts = uiSchemaPathParts(schemaPath);
  // Ajv starts the path of a keyword in a `$ref` target it compiles on its own at that target, so a path the root
  // doesn't lead along to the error's instance and the engine's own schema names no field of the root. One `skipsRefs`
  // reads as `null` does lead along it, to a branch of a field it names either way
  const pathParent = schema && getKeywordParentSchema<S>(schema, schemaPath, decodeSchemaPathKey, skipsRefs);
  // The path's schema is read resolved where it holds a `$ref`, which Ajv's `parentSchema`, as written, doesn't
  const pathKeys = schemaPath.split('/').slice(1, -1).map(decodeSchemaPathKey);
  const leadsToParent =
    isObject(pathParent) &&
    schema !== undefined &&
    leadsToProperty(pathKeys, property, schema) &&
    (parentSchema === undefined ||
      deepEquals(pathParent, parentSchema) ||
      deepEquals(pathKeys.length > 0 ? getByPath(schema, pathKeys) : schema, parentSchema));
  // A path the root doesn't lead along names no field of the root, in the uiSchema as in the schema
  const leadsAlong = !schema || pathParent === null || leadsToParent;
  const fieldSchemaPath = leadsAlong ? getFieldSchemaPath(schemaPath) : schemaPath;
  const fieldSchemaPathParts = uiSchemaPathParts(fieldSchemaPath);
  const fieldSchema =
    schema && fieldSchemaPath !== schemaPath
      ? getKeywordParentSchema<S>(schema, fieldSchemaPath, decodeSchemaPathKey, skipsRefs)
      : undefined;
  const titleOf = (propertySchema: unknown) => {
    let resolved = propertySchema;
    if (schema && stringKeyword(propertySchema, REF_KEY) !== undefined) {
      try {
        // A schema holding a `$ref` string is an object, which `isObject()` narrows to no `S`
        resolved = resolveOwnRef<S>(propertySchema as S, schema);
      } catch {
        // A `$ref` to an `$anchor` or to nothing leaves the `$ref` schema's own `title`
      }
    }
    return getByPath<string | undefined>(resolved, 'title') ?? getByPath<string | undefined>(propertySchema, 'title');
  };
  // Read along the path, a property a merged schema holds resolves its `$ref` in the resource that writes it. The
  // engine's schema is read as it is where the path doesn't lead to it
  const propertyOf = (path: string | undefined, holder: unknown, name: string) =>
    holder === undefined
      ? undefined
      : ((schema && path !== undefined
          ? keywordParentSchemaAt<S>(
              schema,
              [...path.split('/').slice(1, -1).map(decodeSchemaPathKey), PROPERTIES_KEY, name],
              skipsRefs,
            )
          : undefined) ?? getByPath(holder, [PROPERTIES_KEY, name]));
  const parentSchemaPath = leadsToParent ? schemaPath : undefined;
  const titles = new Map<string, string>();
  for (const name of names) {
    // A sub-field named `title` sits at the same path as a raw `title`
    const rawUiTitle = getByPath(uiSchema, [...propParts, name, 'title']);
    const title =
      (getUiOptions<T, S, F>(getByPath(uiSchema, [...propParts, name])).title ??
        getUiOptions<T, S, F>(getByPath(uiSchema, [...itemParts, name])).title ??
        // A path the root can't be read along may still name a field of it
        (leadsAlong || pathParent === undefined
          ? (getUiOptions<T, S, F>(getByPath(uiSchema, [...schemaPathParts, name])).title ??
            getUiOptions<T, S, F>(getByPath(uiSchema, [...fieldSchemaPathParts, name])).title)
          : undefined) ??
        (typeof rawUiTitle === 'string' ? rawUiTitle : undefined)) ||
      titleOf(propertyOf(parentSchemaPath, parentSchema, name)) ||
      titleOf(propertyOf(fieldSchemaPath, fieldSchema, name)) ||
      titleOf(getByPath(schema, [...propParts.flatMap((part) => [PROPERTIES_KEY, part]), PROPERTIES_KEY, name]));
    if (title) {
      titles.set(name, title);
    }
  }
  if (titles.size === 0) {
    return { message, titles };
  }
  // Every name, untitled ones too, longest first, so a titled `'it'` doesn't match the start of an untitled `'it's'`
  const quotedNames = [...names]
    .sort((a, b) => b.length - a.length)
    .map((name) => escapeRegExp(`${quote}${name}${quote}`));
  const titled = message.replace(new RegExp(quotedNames.join('|'), 'g'), (quoted) => {
    const title = titles.get(quoted.slice(quote.length, -quote.length));
    return title ? `'${title}'` : quoted;
  });
  return { message: titled, titles };
}
