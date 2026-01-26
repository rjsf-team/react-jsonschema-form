import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  REF_KEY,
} from './constants';
import findSchemaDefinition from './findSchemaDefinition';
import isObject from './isObject';
import mergeObjects from './mergeObjects';
import {
  FormContextType,
  GenericObjectType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UiSchemaDefinitions,
} from './types';

// Keywords where child schemas map to uiSchema at the SAME key
const SAME_KEY_KEYWORDS = [ITEMS_KEY, ADDITIONAL_PROPERTIES_KEY] as const;

// Keywords where child schemas are in an array, each mapping to uiSchema[keyword][i]
const ARRAY_KEYWORDS = [ONE_OF_KEY, ANY_OF_KEY, ALL_OF_KEY] as const;

/** Expands `ui:definitions` into the uiSchema by walking the schema tree and finding all `$ref`s.
 * Called once at form initialization to pre-expand definitions into the uiSchema structure.
 *
 * For recursive schemas, definitions are embedded at recursion points for runtime lookup.
 *
 * @param currentSchema - The current schema node being processed
 * @param rootSchema - The root JSON schema (for resolving `$ref`s)
 * @param uiSchema - The uiSchema at the current path
 * @param definitions - The ui:definitions to expand
 * @param visited - Set of $refs already visited (to detect recursion)
 * @returns - The expanded uiSchema with definitions merged in
 */
export function expandUiSchemaDefinitions<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  currentSchema: S,
  rootSchema: S,
  uiSchema: UiSchema<T, S, F>,
  definitions: UiSchemaDefinitions<T, S, F>,
  visited: Set<string> = new Set(),
): UiSchema<T, S, F> {
  let result = { ...uiSchema };
  let resolvedSchema = currentSchema;

  const ref = currentSchema[REF_KEY] as string | undefined;
  const isRecursive = ref && visited.has(ref);

  if (ref) {
    visited.add(ref);

    if (ref in definitions) {
      result = mergeObjects(definitions[ref] as GenericObjectType, result as GenericObjectType) as UiSchema<T, S, F>;
    }

    if (isRecursive) {
      result['ui:definitions'] = definitions;
      return result;
    }

    try {
      resolvedSchema = findSchemaDefinition<S>(ref, rootSchema);
    } catch {
      resolvedSchema = currentSchema;
    }
  }

  // Process properties (each property maps to uiSchema[propName] - flattened)
  const properties = resolvedSchema[PROPERTIES_KEY];
  if (properties && isObject(properties)) {
    for (const [propName, propSchema] of Object.entries(properties as Record<string, S>)) {
      const propUiSchema = (result[propName] || {}) as UiSchema<T, S, F>;
      const expanded = expandUiSchemaDefinitions(propSchema, rootSchema, propUiSchema, definitions, new Set(visited));
      if (Object.keys(expanded).length > 0) {
        result[propName] = expanded;
      }
    }
  }

  // Process keywords where child maps to same key in uiSchema (items, additionalProperties)
  for (const keyword of SAME_KEY_KEYWORDS) {
    const subSchema = resolvedSchema[keyword];
    if (subSchema && isObject(subSchema) && !Array.isArray(subSchema)) {
      const currentUiSchema = result[keyword];
      if (typeof currentUiSchema !== 'function') {
        const subUiSchema = ((currentUiSchema as GenericObjectType) || {}) as UiSchema<T, S, F>;
        const expanded = expandUiSchemaDefinitions(
          subSchema as S,
          rootSchema,
          subUiSchema,
          definitions,
          new Set(visited),
        );
        if (Object.keys(expanded).length > 0) {
          (result as GenericObjectType)[keyword] = expanded;
        }
      }
    }
  }

  // Process array keywords (oneOf, anyOf, allOf) - each option maps to uiSchema[keyword][i]
  for (const keyword of ARRAY_KEYWORDS) {
    const schemaOptions = resolvedSchema[keyword];
    if (Array.isArray(schemaOptions) && schemaOptions.length > 0) {
      const currentUiSchemaArray = (result as GenericObjectType)[keyword];
      const uiSchemaArray: UiSchema<T, S, F>[] = Array.isArray(currentUiSchemaArray) ? [...currentUiSchemaArray] : [];

      let hasExpanded = false;
      for (let i = 0; i < schemaOptions.length; i++) {
        const optionSchema = schemaOptions[i] as S;
        const optionUiSchema = (uiSchemaArray[i] || {}) as UiSchema<T, S, F>;
        const expanded = expandUiSchemaDefinitions(
          optionSchema,
          rootSchema,
          optionUiSchema,
          definitions,
          new Set(visited),
        );
        if (Object.keys(expanded).length > 0) {
          uiSchemaArray[i] = expanded;
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

/** Resolves the uiSchema for a given schema, considering `ui:definitions` stored in the registry.
 *
 * This function is called at runtime for each field. It handles recursive schemas where the
 * pre-expansion in `expandUiSchemaDefinitions` couldn't go deeper.
 *
 * When the schema contains a `$ref`, this function looks up the corresponding uiSchema definition
 * from `registry.uiSchemaDefinitions` and merges it with any local uiSchema overrides.
 *
 * Resolution order (later sources override earlier):
 * 1. `ui:definitions[$ref]` - base definition from registry
 * 2. `localUiSchema` - local overrides at current path
 *
 * @param schema - The JSON schema (may still contain `$ref` for recursive schemas)
 * @param localUiSchema - The uiSchema at the current path (local overrides)
 * @param registry - The registry containing `uiSchemaDefinitions`
 * @returns - The resolved uiSchema with definitions merged in
 */
export default function resolveUiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schema: S, localUiSchema: UiSchema<T, S, F> | undefined, registry: Registry<T, S, F>): UiSchema<T, S, F> {
  const embeddedDefinitions = localUiSchema?.['ui:definitions'] as UiSchemaDefinitions<T, S, F> | undefined;
  const definitions = embeddedDefinitions || registry.uiSchemaDefinitions;

  if (!definitions) {
    return localUiSchema || {};
  }

  const ref = schema[REF_KEY] as string | undefined;
  if (!ref || !(ref in definitions)) {
    return localUiSchema || {};
  }

  const definitionUiSchema = definitions[ref];
  let result: UiSchema<T, S, F>;

  if (!localUiSchema || Object.keys(localUiSchema).length === 0) {
    result = { ...definitionUiSchema };
  } else {
    result = mergeObjects(definitionUiSchema as GenericObjectType, localUiSchema as GenericObjectType) as UiSchema<
      T,
      S,
      F
    >;
  }

  result['ui:definitions'] = definitions;
  return result;
}
