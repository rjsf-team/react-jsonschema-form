import isEmpty from 'lodash/isEmpty';

import { ANY_OF_KEY, ONE_OF_KEY, REF_KEY, RJSF_REF_KEY } from './constants';
import findSchemaDefinition from './findSchemaDefinition';
import mergeObjects from './mergeObjects';
import { FormContextType, GenericObjectType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from './types';

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
 * @param localUiSchema - The uiSchema at the current path (local overrides)
 * @param registry - The registry containing `uiSchemaDefinitions`
 * @returns - The resolved uiSchema with definitions merged in
 */
export default function resolveUiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schema: S, localUiSchema: UiSchema<T, S, F> | undefined, registry: Registry<T, S, F>): UiSchema<T, S, F> {
  const ref = ((schema as GenericObjectType)[RJSF_REF_KEY] ?? schema[REF_KEY]) as string | undefined;
  const definitions = registry.uiSchemaDefinitions;
  const definitionUiSchema = ref && definitions ? definitions[ref] : undefined;

  let result: UiSchema<T, S, F>;
  if (!definitionUiSchema) {
    result = localUiSchema || {};
  } else if (!localUiSchema || isEmpty(localUiSchema)) {
    result = { ...definitionUiSchema };
  } else {
    result = mergeObjects(definitionUiSchema as GenericObjectType, localUiSchema as GenericObjectType) as UiSchema<
      T,
      S,
      F
    >;
  }

  // Walk oneOf/anyOf branches to populate uiSchema[keyword][i] so MultiSchemaField
  // can read dropdown option titles at the parent level.
  if (definitions) {
    let resolvedSchema: S = schema;
    if (ref && schema[REF_KEY] && !(schema as GenericObjectType)[RJSF_REF_KEY]) {
      try {
        resolvedSchema = findSchemaDefinition<S>(ref, registry.rootSchema as S);
      } catch (e) {
        console.warn('could not resolve $ref in resolveUiSchema:\n', e);
        return result;
      }
    }

    for (const keyword of [ONE_OF_KEY, ANY_OF_KEY] as const) {
      const schemaOptions = resolvedSchema[keyword];
      if (!Array.isArray(schemaOptions) || schemaOptions.length === 0) {
        continue;
      }

      const currentUiSchemaArray = (result as GenericObjectType)[keyword];
      const uiSchemaArray: UiSchema<T, S, F>[] = Array.isArray(currentUiSchemaArray) ? [...currentUiSchemaArray] : [];

      let hasExpanded = false;
      for (let i = 0; i < schemaOptions.length; i++) {
        const option = schemaOptions[i] as GenericObjectType | undefined;
        const optionRef = (option?.[RJSF_REF_KEY] ?? option?.[REF_KEY]) as string | undefined;
        if (optionRef && optionRef in definitions) {
          const optionUiSchema = (uiSchemaArray[i] || {}) as GenericObjectType;
          uiSchemaArray[i] = mergeObjects(definitions[optionRef] as GenericObjectType, optionUiSchema) as UiSchema<
            T,
            S,
            F
          >;
          hasExpanded = true;
        }
      }

      if (hasExpanded) {
        (result as GenericObjectType)[keyword] = uiSchemaArray;
      }
    }
  }

  return result;
}
