import {
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  ONE_OF_KEY,
  REF_KEY,
  RJSF_REF_KEY,
  THEN_KEY,
  UI_DEFINITION_ORIGIN_KEY,
  UI_OPTIONS_KEY,
} from './constants.ts';
import isObject from './isObject.ts';
import logOnce from './logOnce.ts';
import mergeObjects from './mergeObjects.ts';
import KeyedMemo from './schema/graph/keyedMemo.ts';
import parseSchemaGraph, { stringKeyword } from './schema/graph/parseSchemaGraph.ts';
import { declaresNoKey } from './schema/graph/validationTargets.ts';
import { resolveOwnRef } from './schema/retrieveSchema.ts';
import type { FormContextType, GenericObjectType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Merges a `ui:definitions` entry under the local uiSchema of a field whose schema `$ref`s it. A definition is typed
 * by unknown data, since TypeScript can't follow a `$ref` to the fields it lands on, so the merge is where it is taken
 * to describe the referencing field's `T`: the `$ref` is what makes that so at runtime, and this is the one place
 * `resolveUiSchema()` asserts it
 */
function mergeDefinition<T, S extends StrictRJSFSchema, F extends FormContextType>(
  definition: UiSchema<unknown, S, F>,
  localUiSchema: UiSchema<T, S, F>,
): UiSchema<T, S, F> {
  return mergeObjects(definition, localUiSchema) as UiSchema<T, S, F>;
}

/** Records on `merged`, the entry a `ui:definitions` entry was merged under, the definition's key, the entry as the
 * uiSchema gave it and the definition, for the warnings to tell which of the two holds a key. Not enumerable, so a spread
 * of the entry or a comparison with one written by hand doesn't see it
 */
function recordDefinitionOrigin(merged: object, ref: string, local: unknown, definition: unknown) {
  Object.defineProperty(merged, UI_DEFINITION_ORIGIN_KEY, { value: { ref, local, definition } });
}

/** Returns the name a `ui:definitions` entry for `schema` is keyed by. The marker comes first: a schema resolved from a
 * definition is named by the definition it came from, where a `$ref` it still holds is one nothing has followed yet.
 */
export function definitionRef(schema: unknown): string | undefined {
  return stringKeyword(schema, RJSF_REF_KEY) ?? stringKeyword(schema, REF_KEY);
}

type OptionsKeyword = typeof ONE_OF_KEY | typeof ANY_OF_KEY;

/** `resolveOwnRef()`, logging a reference it can't resolve and giving `undefined` for it */
function tryResolveOwnRef<S extends StrictRJSFSchema>(schema: S, rootSchema: S): S | undefined {
  try {
    return resolveOwnRef<S>(schema, rootSchema);
  } catch (e) {
    logOnce('could not resolve $ref in resolveUiSchema:\n', { error: e });
    return undefined;
  }
}

function listedOptions(schema: StrictRJSFSchema, keyword: OptionsKeyword): unknown[] | undefined {
  const options = schema[keyword];
  return Array.isArray(options) && options.length > 0 ? options : undefined;
}

/** Returns the `oneOf` and `anyOf` lists the field of `schema` offers once `retrieveSchema()` merges its `allOf`: its
 * own, or the one an `allOf` member offers, which the merge hoists as it is. Two lists are merged into the pairings of
 * their options, whose positions need not be those of either list, so there is none to return for that keyword then.
 * Nor is there where a `then`/`else` or `dependencies` entry offers one, which the data merges in or not. A
 * `dependencies` entry's own `oneOf` whose options declare its key offers none: the data picks the option merged in, so
 * only the lists its options offer are conditional
 *
 * @param schema - The field's schema, with its own `$ref` resolved
 * @param fieldRef - The `$ref` the field's schema was resolved from, if any, so a member looping back to it isn't
 *   read twice
 * @param rootSchema - The root schema an `allOf` member's `$ref` is resolved against
 * @returns - For each keyword, the one list offered, if exactly one is
 */
function offeredOptions<S extends StrictRJSFSchema>(
  schema: S,
  fieldRef: string | undefined,
  rootSchema: S,
): Record<OptionsKeyword, unknown[] | undefined> {
  if (([ALL_OF_KEY, THEN_KEY, ELSE_KEY, DEPENDENCIES_KEY] as const).every((key) => schema[key] === undefined)) {
    return { [ONE_OF_KEY]: listedOptions(schema, ONE_OF_KEY), [ANY_OF_KEY]: listedOptions(schema, ANY_OF_KEY) };
  }
  const lists: Record<OptionsKeyword, unknown[][]> = { [ONE_OF_KEY]: [], [ANY_OF_KEY]: [] };
  const conditional = new Set<OptionsKeyword>();
  const followed = new KeyedMemo<boolean>();
  if (fieldRef) {
    followed.set([fieldRef], true);
  }
  const collect = (node: unknown, inBranch: boolean, dependencyKey?: string) => {
    if (!isObject(node)) {
      return;
    }
    let resolved: S | undefined = node as S;
    const ref = stringKeyword(node, REF_KEY);
    const isFollowed = ref !== undefined && node !== schema;
    if (isFollowed) {
      // A member naming a definition already followed is one whose `allOf` loops back to it. A branch is followed per
      // occurrence and `dependencies` key, as the keywords beside its `$ref` and the key choosing its option can differ
      const visit = inBranch ? [node, dependencyKey] : [ref];
      if (followed.peek(visit)) {
        return;
      }
      followed.set(visit, true);
      resolved = tryResolveOwnRef<S>(resolved, rootSchema);
      if (!resolved) {
        return;
      }
    }
    const selector = listedOptions(resolved, ONE_OF_KEY);
    if (dependencyKey !== undefined && selector) {
      const { graph, node: id } = parseSchemaGraph(rootSchema).adopt(resolved);
      if (!declaresNoKey(graph, id, dependencyKey)) {
        selector.forEach((option) => collect(option, true));
        resolved = { ...resolved, [ONE_OF_KEY]: undefined };
      }
    }
    // A `$ref` reaching a list already read under another name, such as an alias of the field's own definition, reaches
    // the same list again
    for (const keyword of [ONE_OF_KEY, ANY_OF_KEY] as const) {
      const options = listedOptions(resolved, keyword);
      if (options && inBranch) {
        conditional.add(keyword);
      } else if (options && !(isFollowed && lists[keyword].includes(options))) {
        lists[keyword].push(options);
      }
    }
    const members = resolved[ALL_OF_KEY];
    if (Array.isArray(members)) {
      members.forEach((member) => collect(member, inBranch));
    }
    const dependencies = resolved[DEPENDENCIES_KEY];
    [resolved[THEN_KEY], resolved[ELSE_KEY]].forEach((branch) => collect(branch, true));
    if (isObject(dependencies)) {
      Object.entries(dependencies).forEach(([key, entry]) => collect(entry, true, key));
    }
  };
  collect(schema, false);
  const one = (keyword: OptionsKeyword) =>
    lists[keyword].length === 1 && !conditional.has(keyword) ? lists[keyword][0] : undefined;
  return { [ONE_OF_KEY]: one(ONE_OF_KEY), [ANY_OF_KEY]: one(ANY_OF_KEY) };
}

/** Resolves the uiSchema for a given schema, considering `ui:definitions` stored in the registry.
 *
 * Called at runtime for each field. When the schema contains a `$ref`, looks up the corresponding
 * uiSchema definition from `registry.uiSchemaDefinitions` and merges it with local overrides.
 * For schemas with `oneOf`/`anyOf` branches, its own or those of an `allOf` member, also populates
 * `uiSchema[keyword][i]` for branches whose `$ref` matches a definition, so `MultiSchemaField` can read dropdown option
 * titles. It populates none for a keyword that two lists, or a `then`/`else` or `dependencies` entry, offer, since the
 * list the field shows then need not keep the written positions; `mergeOptionDefinitions()` merges those. A
 * `dependencies` entry's `oneOf` whose options declare the entry's key doesn't count, as the data picks one of its
 * options to merge in rather than showing it, though a list one of its options offers does.
 *
 * Resolution order (later sources override earlier):
 * 1. `ui:definitions[$ref]` - base definition from registry
 * 2. `localUiSchema` - local overrides at current path
 *
 * @param schema - The JSON schema (may contain `$ref` or `RJSF_REF_KEY`)
 * @param rawLocalUiSchema - The uiSchema at the current path (local overrides), as the caller supplied it
 * @param registry - The registry containing `uiSchemaDefinitions`
 * @returns - The resolved uiSchema with definitions merged in
 */
export default function resolveUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  rawLocalUiSchema: UiSchema<T, S, F> | undefined,
  registry: Pick<Registry<T, S, F>, 'rootSchema' | 'uiSchemaDefinitions'>,
): UiSchema<T, S, F> {
  const ref = definitionRef(schema);
  const definitions = registry.uiSchemaDefinitions;
  const definitionUiSchema = ref && definitions ? definitions[ref] : undefined;

  // A uiSchema arrives from outside the type system, so a field's entry can be any value a caller put under its name.
  // Normalizing it here is what lets every field, widget and template treat its own uiSchema as an object
  const localUiSchema = isObject(rawLocalUiSchema) ? rawLocalUiSchema : undefined;

  let result: UiSchema<T, S, F>;
  if (!definitionUiSchema) {
    result = localUiSchema ?? {};
  } else {
    result = mergeDefinition(definitionUiSchema, localUiSchema ?? {});
  }

  // The same goes for `ui:options`: consumers spread it and use `in` on it, both of which assume an object
  if (UI_OPTIONS_KEY in result && !isObject(result[UI_OPTIONS_KEY])) {
    result = { ...result };
    delete result[UI_OPTIONS_KEY];
  }
  // Recorded last, on the object handed back, since the `ui:options` copy above drops a property that isn't enumerable
  const recorded = (resolved: UiSchema<T, S, F>) => {
    if (ref && definitionUiSchema) {
      recordDefinitionOrigin(resolved, ref, localUiSchema, definitionUiSchema);
    }
    return resolved;
  };

  // Walk oneOf/anyOf branches to populate uiSchema[keyword][i] so MultiSchemaField
  // can read dropdown option titles at the parent level.
  if (definitions) {
    const resolvedSchema =
      ref && stringKeyword(schema, REF_KEY) && !stringKeyword(schema, RJSF_REF_KEY)
        ? tryResolveOwnRef<S>(schema, registry.rootSchema)
        : schema;
    if (!resolvedSchema) {
      return recorded(result);
    }

    const offered = offeredOptions<S>(resolvedSchema, ref, registry.rootSchema);
    for (const keyword of [ONE_OF_KEY, ANY_OF_KEY] as const) {
      const schemaOptions = offered[keyword];
      if (schemaOptions) {
        const currentUiSchemaArray = (result as GenericObjectType)[keyword];
        const uiSchemaArray: UiSchema<T, S, F>[] = Array.isArray(currentUiSchemaArray) ? [...currentUiSchemaArray] : [];

        let hasExpanded = false;
        for (let i = 0; i < schemaOptions.length; i++) {
          const optionRef = definitionRef(schemaOptions[i]);
          if (optionRef && optionRef in definitions) {
            const local = uiSchemaArray[i];
            uiSchemaArray[i] = mergeDefinition(definitions[optionRef], local || {});
            recordDefinitionOrigin(uiSchemaArray[i], optionRef, local, definitions[optionRef]);
            hasExpanded = true;
          }
        }

        if (hasExpanded) {
          // The caller's own uiSchema is copied, or it would hold the merged entries in place of the ones it gave the next
          // time it is resolved
          if (result === localUiSchema) {
            result = { ...result };
          }
          (result as GenericObjectType)[keyword] = uiSchemaArray;
        }
      }
    }
  }

  return recorded(result);
}

/** Merges the `ui:definitions` entry each `anyOf`/`oneOf` option's ref names under the option's uiSchema entry, where
 * `resolveUiSchema()` didn't merge one, and records its origin, as `resolveUiSchema()` does for an option the field's
 * schema offers. `resolveUiSchema()` reads the schema as it is written, so it doesn't reach the options a `then`/`else`
 * or a `dependencies` entry offers, which `retrieveSchema()` hoists to the field only where the data selects it, nor
 * any the field offers beside such a list or beside another list an `allOf` member offers. A `dependencies` entry's
 * `oneOf` whose options declare the entry's key isn't such a list, since the data picks the option `retrieveSchema()`
 * merges in, but a list one of those options offers is. The `anyOf`/`oneOf` field and the `ui:required` walk call
 * this, so they agree on the entry such an option has
 *
 * @param refs - The `ui:definitions` key each option's schema is named by, as `resolveUiSchema()` reads it, if any
 * @param optionsUiSchema - The field's `uiSchema.anyOf`/`oneOf` entries, or `[]` where it gives none
 * @param registry - The registry containing `uiSchemaDefinitions`
 * @returns - `optionsUiSchema`, or a copy with the merged entries where there are any
 */
export function mergeOptionDefinitions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  refs: readonly (string | null | undefined)[],
  optionsUiSchema: UiSchema<T, S, F>[],
  registry: Pick<Registry<T, S, F>, 'rootSchema' | 'uiSchemaDefinitions'>,
): UiSchema<T, S, F>[] {
  const definitions = registry.uiSchemaDefinitions;
  let merged = optionsUiSchema;
  refs.forEach((ref, i) => {
    const local: unknown = optionsUiSchema[i];
    if (
      !ref ||
      !definitions ||
      !Object.hasOwn(definitions, ref) ||
      (isObject(local) && UI_DEFINITION_ORIGIN_KEY in local)
    ) {
      return;
    }
    if (merged === optionsUiSchema) {
      merged = [...optionsUiSchema];
    }
    // A schema naming only the definition, which is all `resolveUiSchema()` reads to merge it
    merged[i] = resolveUiSchema<T, S, F>({ [RJSF_REF_KEY]: ref } as unknown as S, optionsUiSchema[i], registry);
  });
  return merged;
}
