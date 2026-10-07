import { ANY_OF_KEY, ONE_OF_KEY, UI_OPTIONS_KEY } from './constants.ts';
import findSchemaDefinition from './findSchemaDefinition.ts';
import isObject from './isObject.ts';
import logOnce from './logOnce.ts';
import mergeObjects from './mergeObjects.ts';
import { declaredRef, resolvedFromRef } from './refOf.ts';
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

/** Resolves the uiSchema for a given schema, considering `ui:definitions` stored in the registry.
 *
 * Called at runtime for each field. When the schema contains a `$ref`, looks up the corresponding
 * uiSchema definition from `registry.uiSchemaDefinitions` and merges it with local overrides.
 * For schemas with `oneOf`/`anyOf` branches, also populates `uiSchema[keyword][i]` for branches
 * whose `$ref` matches a definition, so `MultiSchemaField` can read dropdown option titles.
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
  // The marker comes first: a schema resolved from a definition is named by the definition it came from, which is
  // the name a `ui:definitions` entry is keyed by, where a `$ref` it still holds is one nothing has followed yet.
  // `refOf()` in `retrieveSchema.ts` reads the same two the other way about, for the opposite reason
  const ref = resolvedFromRef<S>(schema) ?? declaredRef<S>(schema);
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

  // Walk oneOf/anyOf branches to populate uiSchema[keyword][i] so MultiSchemaField
  // can read dropdown option titles at the parent level.
  if (definitions) {
    let resolvedSchema: S = schema;
    if (ref && declaredRef<S>(schema) && !resolvedFromRef<S>(schema)) {
      try {
        resolvedSchema = findSchemaDefinition<S>(ref, registry.rootSchema);
      } catch (e) {
        logOnce('could not resolve $ref in resolveUiSchema:\n', 'warn', e);
        return result;
      }
    }

    for (const keyword of [ONE_OF_KEY, ANY_OF_KEY] as const) {
      const schemaOptions = resolvedSchema[keyword];
      if (Array.isArray(schemaOptions) && schemaOptions.length > 0) {
        const currentUiSchemaArray = (result as GenericObjectType)[keyword];
        const uiSchemaArray: UiSchema<T, S, F>[] = Array.isArray(currentUiSchemaArray) ? [...currentUiSchemaArray] : [];

        let hasExpanded = false;
        for (let i = 0; i < schemaOptions.length; i++) {
          const option = schemaOptions[i] as S | undefined;
          const optionRef = resolvedFromRef<S>(option) ?? declaredRef<S>(option);
          if (optionRef && optionRef in definitions) {
            uiSchemaArray[i] = mergeDefinition(definitions[optionRef], uiSchemaArray[i] || {});
            hasExpanded = true;
          }
        }

        if (hasExpanded) {
          (result as GenericObjectType)[keyword] = uiSchemaArray;
        }
      }
    }
  }

  return result;
}
