import type {
  Field,
  FieldPath,
  FieldProps,
  FormContextType,
  GlobalFormOptions,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from '@rjsf/utils';
import { getByPath, getUiOptions, isComponentType, UI_FIELD_KEY, UI_OPTIONS_KEY } from '@rjsf/utils';

import describeUnresolvedComponent from '../../describeUnresolvedComponent.ts';
import { entryLabelForLog } from '../../fieldLabelForLog.ts';

/** Looks up what a `ui:field` refers to: the value registered under it when it is a name, otherwise the `ui:field`
 * itself. `getByPath()` reads own properties only, so a name such as `constructor` or `toString` resolves to nothing
 * rather than to something off `Object.prototype`, which rendered as a component threw "Objects are not valid as a
 * React child"
 *
 * @param field - The `field` from the UI options
 * @param fields - The registered fields
 * @returns - The value the `ui:field` refers to, which is not necessarily a component
 */
export function lookUpUiField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(field: UIOptionsType<T, S, F>['field'], fields: Registry<T, S, F>['fields']): unknown {
  return typeof field === 'string' ? getByPath(fields, field) : field;
}

/** Whether a named field is one written for the schema, which draws its own label, rather than `SchemaField` or
 * `FallbackField`, which `SchemaField` renders the data through when no field is named, so naming either leaves the
 * label and the field's frame as they are when the schema's type picks the field
 *
 * @param field - The field `resolveNamedField()` resolved, if one is named
 * @param fields - The registered fields
 * @returns - Whether a field is named that is neither `SchemaField` nor `FallbackField`
 */
function isWrittenField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(field: Field<T, S, F> | undefined, fields: Registry<T, S, F>['fields']): boolean {
  return field !== undefined && field !== fields.SchemaField && field !== fields.FallbackField;
}

/** Returns `uiSchema` with the field it names removed in both spellings, for what renders at the same data path as the
 * named field
 *
 * @param uiSchema - The field's `uiSchema`
 * @returns - `uiSchema` itself when nothing names a field, else a copy naming none
 */
export function withoutNamedField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F>): UiSchema<T, S, F> {
  const { field, ...uiOptionsWithoutField } = uiSchema[UI_OPTIONS_KEY] ?? {};
  if (uiSchema[UI_FIELD_KEY] === undefined && field === undefined) {
    return uiSchema;
  }
  const uiSchemaWithoutField: UiSchema<T, S, F> = { ...uiSchema, [UI_OPTIONS_KEY]: uiOptionsWithoutField };
  delete uiSchemaWithoutField[UI_FIELD_KEY];
  return uiSchemaWithoutField;
}

/** The field a `ui:field` or `$id` names, what was ignored on the way to it, and the `uiSchema` the field is read by */
export interface NamedFieldResolution<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The field `getFieldComponent()` renders in place of the one for the schema's type, if one is named */
  namedField?: Field<T, S, F>;
  /** The registry key it was named by, when it was named by one rather than given as the component, which the field is
   * planned by
   */
  namedFieldKey?: string;
  /** The warning for each `ui:field` or `$id` that was given but names no field */
  ignored: readonly string[];
  /** The field's `uiSchema` as everything rendering or labelling its data reads it: as given where it names a field
   * written for the schema, which reads it itself, and otherwise naming no field. Where none is written for the schema
   * the data renders as though none were named — none resolved, or the one that did is `SchemaField` or `FallbackField`
   * — so the label `getDisplayLabel()` would leave to a named field, the value field `FallbackField` renders, the
   * `anyOf`/`oneOf` options, whose fields would name it again, and the plan the array item holding the field is laid
   * out by all read it as naming none. A spelling ignored on the way to a field written for the schema names no field
   * either, so that field and its templates read the `uiSchema` naming none rather than the name that was ignored
   */
  uiSchema: UiSchema<T, S, F>;
}

/** The warning that a spelling of the named field was ignored
 *
 * @param entry - The entry that was given
 * @param value - What the entry holds
 * @param resolved - What that value refers to
 * @param renders - What renders in place of the field it names
 * @returns - The warning
 */
function ignoredMessage(entry: string, value: unknown, resolved: unknown, renders: string): string {
  return `${entry} ${describeUnresolvedComponent(value, resolved, 'registered field', 'MyField')}, so it is ignored and the ${renders}.`;
}

/** Resolves the one field a schema's field is named by: its own `ui:field`, else the schema's `$id`, each given as a
 * component or as the name of a registered field. Whichever of the two names the field, the same field is selected,
 * beside the schema's `anyOf`/`oneOf` options or in their place under `ui:fieldReplacesAnyOrOneOf` (#5391). A component
 * is either a function or one of the objects `memo()`, `forwardRef()` and `lazy()` return, all of which `Field`'s type
 * admits, and a registered value is checked the same way as one given directly, since `fields` can hold anything a
 * caller passes in. `SchemaField` resolves its own field through this as it plans the field, and the array item holding
 * the field lays its template out by that same plan, so the two cannot disagree about which field is named.
 *
 * An empty `ui:field` — `undefined`, `null`, `false`, `''` or `0` — asks for no field, so it isn't warned about. A `$id`
 * is an identifier first, so one naming no field is not warned about, but one something other than a component is
 * registered under is, since registering it asked for a field.
 *
 * @param ownUiSchema - The field's own `uiSchema`
 * @param schemaId - The schema's `$id`
 * @param fields - The registered fields
 * @param fieldPath - The field's path, which names its own `ui:field` entry in the warning
 * @param globalFormOptions - The form's options, which name the entry the same way
 * @returns - The field to render, if any, the registry key it was named by, the warning for each `ui:field` or `$id`
 *   that was ignored, and the `uiSchema` the field is read by
 */
export function resolveNamedField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  ownUiSchema: UiSchema<T, S, F>,
  schemaId: string | undefined,
  fields: Registry<T, S, F>['fields'],
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
): NamedFieldResolution<T, S, F> {
  const ignored: string[] = [];
  const named = (namedField: Field<T, S, F>, namedFieldKey: string | undefined): NamedFieldResolution<T, S, F> => ({
    namedField,
    namedFieldKey,
    ignored,
    uiSchema:
      isWrittenField<T, S, F>(namedField, fields) && ignored.length === 0
        ? ownUiSchema
        : withoutNamedField<T, S, F>(ownUiSchema),
  });
  const ownField = getUiOptions<T, S, F>(ownUiSchema).field;
  if (ownField) {
    const resolved = lookUpUiField<T, S, F>(ownField, fields);
    if (isComponentType<FieldProps<T, S, F>>(resolved)) {
      return named(resolved, typeof ownField === 'string' ? ownField : undefined);
    }
    ignored.push(
      ignoredMessage(
        `ui:field for ${entryLabelForLog(fieldPath, globalFormOptions)}`,
        ownField,
        resolved,
        'field is rendered as though no ui:field were given',
      ),
    );
  }
  if (schemaId) {
    const resolved = lookUpUiField<T, S, F>(schemaId, fields);
    if (isComponentType<FieldProps<T, S, F>>(resolved)) {
      return named(resolved, schemaId);
    }
    if (resolved != null) {
      ignored.push(
        ignoredMessage(
          '$id',
          schemaId,
          resolved,
          'fields of the schema carrying it are rendered as though no field were registered under it',
        ),
      );
    }
  }
  return { ignored, uiSchema: withoutNamedField<T, S, F>(ownUiSchema) };
}
