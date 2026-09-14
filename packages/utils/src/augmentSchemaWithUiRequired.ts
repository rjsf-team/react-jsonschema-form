import { DEPENDENCIES_KEY, PROPERTIES_KEY, REQUIRED_KEY } from './constants.ts';
import getPropertySchema from './getPropertySchema.ts';
import getSchemaType from './getSchemaType.ts';
import getUiOptions from './getUiOptions.ts';
import isObject from './isObject.ts';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Recursively walks an object `schema` and its `uiSchema`, returning a new schema with every property marked
 * `ui:required: true` added to the nearest enclosing `required` array. This lets `ui:required` affect schema-level
 * validation (which only consults `required`) without mutating the caller's original schema or uiSchema.
 *
 * Whether a `schema` counts as an object is delegated to `getSchemaType()`, so an object schema with no explicit
 * `type` (inferred from `properties`) or `type: ['object', 'null']` is handled, matching the schema types RJSF
 * itself treats as objects elsewhere. For a multi-type array that doesn't include `'null'` (e.g.
 * `type: ['object', 'string']`), `getSchemaType()` returns only the first entry, so augmentation depends on that
 * array's order — a pre-existing characteristic of `getSchemaType()`, not something specific to this function.
 *
 * A schema-form `dependencies` entry (`dependencies: { a: { properties: {...} } }`) is walked the same way as a
 * plain nested property, using the same `uiSchema` a sibling of the dependency's trigger property would use, since
 * AJV applies that subschema (property-dependency arrays are left untouched, having no schema to add `required` to).
 * This works without resolving anything: AJV natively validates `dependencies` as its own subschema, so adding to
 * its `required` array is enough, unlike `$ref`, `allOf` or `if`/`then`/`else`, which RJSF must first flatten via
 * `retrieveSchema()` before a property they introduce even appears in a schema's own `properties`. `Form` only does
 * that resolution on the `liveValidate` path, so `ui:required` on a field introduced that way is not folded into
 * validation on the plain-submit path; see the `required` docs for this and the `allOf` gap.
 *
 * @param schema - The schema to augment
 * @param [uiSchema] - The uiSchema, if any, containing the `ui:required` overrides
 * @returns - A new schema with `ui:required` fields folded into `required` arrays, or the original `schema` if
 *          nothing changed
 */
export default function augmentSchemaWithUiRequired<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schema: S, uiSchema?: UiSchema<T, S, F>): S {
  const properties = schema[PROPERTIES_KEY];
  const dependencies = schema[DEPENDENCIES_KEY] as GenericObjectType | undefined;
  if (!uiSchema || getSchemaType<S>(schema) !== 'object' || (!properties && !dependencies)) {
    return schema;
  }

  const existingRequired = schema[REQUIRED_KEY] ?? [];
  const additionalRequired: string[] = [];
  let newProperties = properties;
  let propertiesChanged = false;

  Object.keys(properties ?? {}).forEach((key) => {
    const fieldUiSchema = uiSchema[key] as UiSchema<T, S, F> | undefined;
    if (!fieldUiSchema) {
      return;
    }
    const { required: uiRequired } = getUiOptions<T, S, F>(fieldUiSchema);
    if (uiRequired === true && !existingRequired.includes(key)) {
      additionalRequired.push(key);
    }

    const propertySchema = getPropertySchema<S>(schema, key);
    const augmentedProperty = augmentSchemaWithUiRequired<T, S, F>(propertySchema, fieldUiSchema);
    if (augmentedProperty !== propertySchema) {
      if (!propertiesChanged) {
        newProperties = { ...properties };
        propertiesChanged = true;
      }
      newProperties![key] = augmentedProperty;
    }
  });

  let newDependencies = dependencies;
  let dependenciesChanged = false;

  Object.keys(dependencies ?? {}).forEach((key) => {
    const dependency = dependencies![key];
    // Property-dependency form (`dependencies: { a: ['b', 'c'] }`) lists sibling property names rather than a
    // schema, so there's nothing here to fold `ui:required` into.
    if (!isObject(dependency)) {
      return;
    }
    const augmentedDependency = augmentSchemaWithUiRequired<T, S, F>(dependency as S, uiSchema);
    if (augmentedDependency !== dependency) {
      if (!dependenciesChanged) {
        newDependencies = { ...dependencies };
        dependenciesChanged = true;
      }
      newDependencies![key] = augmentedDependency;
    }
  });

  if (additionalRequired.length === 0 && !propertiesChanged && !dependenciesChanged) {
    return schema;
  }

  return {
    ...schema,
    ...(propertiesChanged ? { [PROPERTIES_KEY]: newProperties } : {}),
    ...(dependenciesChanged ? { [DEPENDENCIES_KEY]: newDependencies } : {}),
    ...(additionalRequired.length > 0 ? { [REQUIRED_KEY]: [...existingRequired, ...additionalRequired] } : {}),
  };
}
