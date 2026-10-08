import getSchemaType from './getSchemaType.ts';
import getUiOptions from './getUiOptions.ts';
import getXxxOfOptions from './getXxxOfOptions.ts';
import isObject from './isObject.ts';
import isRootSchema from './isRootSchema.ts';
import type {
  FormContextType,
  GlobalUISchemaOptions,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from './types.ts';

/** Returns the unique list of schema types for all of the options in a anyOf/oneOf
 *
 * @param schemas - The list of schemas representing the XxxOf options
 * @returns - All of the unique types contained within the oneOf list
 */
export function getSchemaTypesForXxxOf<S extends StrictRJSFSchema = RJSFSchema>(schemas: S[]): string | string[] {
  const allTypes: string[] = [...new Set(schemas.flatMap((s) => (isObject(s) ? (getSchemaType<S>(s) ?? []) : [])))];
  return allTypes.length === 1 ? allTypes[0] : allTypes;
}

/** Returns the type of the field that the Optional Data Controls UI is rendered for. An `anyOf`/`oneOf` schema has no
 * `type` of its own, so its type is the unique list of its options' types (a single type when they all agree), and
 * `undefined` when no option names one; otherwise, including for an empty `anyOf: []`/`oneOf: []`, it is the schema's
 * own type.
 *
 * @param schema - The schema for the field
 * @returns - The type of the field, the unique list of its `anyOf`/`oneOf` options' types, or `undefined` when neither
 *            names one
 */
export function getOptionalDataControlsType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): string | string[] | undefined {
  const xxxOf = getXxxOfOptions<S>(schema);
  if (!xxxOf) {
    return getSchemaType<S>(schema);
  }
  const optionTypes = getSchemaTypesForXxxOf<S>(xxxOf.options);
  return Array.isArray(optionTypes) && optionTypes.length === 0 ? undefined : optionTypes;
}

/** Determines whether the type of the field for `schema` is one that `enableOptionalDataFieldForType` turns the Optional
 * Data Controls UI on for. A field whose `anyOf`/`oneOf` options name several types is never one of them, while a
 * `type` list counts as the type `getSchemaType()` resolves it to.
 *
 * @param schema - The schema for the field
 * @param [uiSchema] - The uiSchema for the field
 * @param [globalUiOptions] - The global UI options, from the `registry`
 * @returns - True if the Optional Data Controls UI is enabled for the type of the field, otherwise false
 */
export function isOptionalDataControlsType<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schema: S,
  uiSchema?: UiSchema<T, S, F>,
  globalUiOptions?: GlobalUISchemaOptions,
): boolean {
  const { enableOptionalDataFieldForType = [] } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  if (enableOptionalDataFieldForType.length === 0) {
    return false;
  }
  const schemaType = getOptionalDataControlsType<S>(schema);
  return typeof schemaType === 'string' && enableOptionalDataFieldForType.some((val) => val === schemaType);
}

/** Determines whether the field information from the combination of `schema` and `required` along with the
 * `enableOptionalDataFieldForType` settings from the global UI options in the `registry` all indicate that this field
 * should be rendered with the Optional Data Controls UI.
 *
 * @param registry - The `registry` object
 * @param schema - The schema for the field
 * @param required - Flag indicating whether the field is required
 * @param [uiSchema] - The uiSchema for the field
 * @return - True if the field should be rendered with the optional field UI, otherwise false
 */
export default function shouldRenderOptionalField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(registry: Registry<T, S, F>, schema: S, required: boolean, uiSchema?: UiSchema<T, S, F>): boolean {
  return (
    !required &&
    isOptionalDataControlsType<T, S, F>(schema, uiSchema, registry.globalUiOptions) &&
    !isRootSchema<T, S, F>(registry, schema)
  );
}
