import { ROOT_FIELD_PATH } from './fieldPath.ts';
import getRenderedOptionSchema from './getRenderedOptionSchema.ts';
import getSchemaOwnTypes from './getSchemaOwnTypes.ts';
import getSchemaType from './getSchemaType.ts';
import getUiOptions from './getUiOptions.ts';
import getXxxOfOptions from './getXxxOfOptions.ts';
import { isSchemaObject } from './isObject.ts';
import { resolveOwnRef } from './schema/retrieveSchema.ts';
import type {
  FieldPath,
  FormContextType,
  GlobalUISchemaOptions,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from './types.ts';

/** Returns the type of the field that the Optional Data Controls UI is rendered for. An `anyOf`/`oneOf` schema's type
 * is read from its options as they render: each option written as a `$ref` is resolved against `rootSchema`, and each
 * one naming or implying no type of its own takes what `getRenderedOptionSchema()` passes it from the schema, so it has
 * the schema's own type, as the option `MultiSchemaField` renders does. The type is the one the options agree on, the
 * unique list of them when they name several, a `null` option counted among them so that such a list keeps the
 * selector the `null` branch is reached through, and `undefined` when they name none. Otherwise, including for an
 * empty `anyOf: []`/`oneOf: []`, it is the schema's own type.
 *
 * @param schema - The schema for the field
 * @param rootSchema - The root schema an option written as a `$ref` names its definition in
 * @returns - The type of the field, the list of its `anyOf`/`oneOf` options' types when they name several, or
 *            `undefined` when neither names one
 */
export function getOptionalDataControlsType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
): string | string[] | undefined {
  const xxxOf = getXxxOfOptions<S>(schema);
  if (!xxxOf) {
    return getSchemaType<S>(schema);
  }
  const types = [
    ...new Set(
      xxxOf.options.flatMap((option) => {
        if (!isSchemaObject<S>(option)) {
          return [];
        }
        const resolved = resolveOwnRef<S>(option, rootSchema);
        const ownTypes = getSchemaOwnTypes<S>(resolved);
        // Read from the option's own types rather than `getSchemaType()`, which reads any typeless `enum` as `string`:
        // an `enum: [null]` is the `null` branch too, and an `enum` of arrays a select over whole arrays.
        // Only an option that implies no type of its own takes the schema's, which keeps a `properties` option an
        // object under a `['array', 'object']` schema whose first type it would otherwise take
        if (ownTypes) {
          return ownTypes.find((type) => type !== 'null') ?? 'null';
        }
        return getSchemaType<S>(getRenderedOptionSchema<S>(schema, resolved)) ?? [];
      }),
    ),
  ];
  return types.length > 1 ? types : types[0];
}

/** Determines whether the type of the field for `schema` is one that `enableOptionalDataFieldForType` turns the Optional
 * Data Controls UI on for. A field whose `anyOf`/`oneOf` options name several types is never one of them, while a
 * `type` list counts as the type `getSchemaType()` resolves it to.
 *
 * @param schema - The schema for the field, or a function building it, called only once the uiSchema turns the Optional
 *        Data Controls UI on for some type, which by default it does for none
 * @param uiSchema - The uiSchema for the field, if any
 * @param globalUiOptions - The global UI options, from the `registry`, if any
 * @param rootSchema - The root schema, see `getOptionalDataControlsType()`
 * @returns - True if the Optional Data Controls UI is enabled for the type of the field, otherwise false
 */
export function isOptionalDataControlsType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S | (() => S),
  uiSchema: UiSchema<T, S, F> | undefined,
  globalUiOptions: GlobalUISchemaOptions | undefined,
  rootSchema: S,
): boolean {
  const { enableOptionalDataFieldForType = [] } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  if (enableOptionalDataFieldForType.length === 0) {
    return false;
  }
  const schemaType = getOptionalDataControlsType<S>(typeof schema === 'function' ? schema() : schema, rootSchema);
  return typeof schemaType === 'string' && enableOptionalDataFieldForType.some((val) => val === schemaType);
}

/** Determines whether the field information from the combination of `schema` and `required` along with the
 * `enableOptionalDataFieldForType` settings from the global UI options in the `registry` all indicate that this field
 * should be rendered with the Optional Data Controls UI. The root field never is: it is the form itself, which has no
 * parent to leave it out of.
 *
 * @param registry - The `registry` object
 * @param schema - The schema for the field
 * @param required - Flag indicating whether the field is required
 * @param uiSchema - The uiSchema for the field, if any
 * @param fieldPath - The `FieldPath` of the field, which is `ROOT_FIELD_PATH` for the root field
 * @return - True if the field should be rendered with the optional field UI, otherwise false
 */
export default function shouldRenderOptionalField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  registry: Registry<T, S, F>,
  schema: S,
  required: boolean,
  uiSchema: UiSchema<T, S, F> | undefined,
  fieldPath: FieldPath,
): boolean {
  return (
    fieldPath !== ROOT_FIELD_PATH &&
    !required &&
    isOptionalDataControlsType<T, S, F>(schema, uiSchema, registry.globalUiOptions, registry.rootSchema)
  );
}
