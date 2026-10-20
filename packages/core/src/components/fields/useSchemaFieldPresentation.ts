import type { ReactElement } from 'react';
import { useMemo } from 'react';
import type {
  Field,
  FieldPresentation,
  FormContextType,
  ONE_OF_KEY,
  Registry,
  ResolvedPresentationDeclaration,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Widget,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  getFieldTypeForUiSchema,
  getPresentationDeclaration,
  getSchemaType,
  isObject,
  ITEMS_KEY,
  REF_KEY,
  resolveFieldPresentation,
  schemaRequiresTrueValue,
  UI_FIELD_KEY,
} from '@rjsf/utils';

import getFieldWidget, { displaysLabel, withoutDescribers } from './fieldWidgetUtils.ts';

/** The fields of core's that render no control for a template label to name: a container, whose label is its own
 * heading, and `NullField`, which renders nothing. `ArrayField` is one only when it renders no widget
 */
const CONTROLLESS_FIELD_KEYS = ['ObjectField', 'NullField', 'LayoutGridField', 'LayoutHeaderField'] as const;

/** What `SchemaField` has decided about a field by the time it plans it */
export interface SchemaFieldPresentationInputs<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The id of the field */
  id: string;
  /** The id the field component renders under, when it renders beside the schema's options under an id of its own */
  componentId?: string;
  /** The registry, whose `presentation`, `fields` and `widgets` are read */
  registry: Registry<T, S, F>;
  /** The schema the field renders */
  schema: S;
  /** The uiSchema the field renders */
  uiSchema: UiSchema<T, S, F>;
  /** The field component that renders, or undefined when none does, as for a `$ref` cycle. Read only when `xxxOfKey`
   * is not given
   */
  field?: Field<T, S, F>;
  /** The registry key that named `field`, if one did */
  fieldKey?: string;
  /** The keyword of the options the field is withheld for, which their `AnyOfField` or `OneOfField` renders in its
   * place, so that field is the one planned
   */
  xxxOfKey?: typeof ANY_OF_KEY | typeof ONE_OF_KEY;
  /** The label, from `getFieldLabel()` */
  label: string;
  /** Whether `ui:label` lets the field show its label, already resolved through the fields above */
  showLabel: boolean;
  description: string;
  help?: string | ReactElement;
  /** The field's own error messages */
  errors?: readonly string[];
  /** Whether `ui:hideError` is in effect */
  hideError?: boolean;
  /** Whether no control is on screen however the field renders: a hidden field, or an opted-out optional one */
  hidden: boolean;
  /** Whether the field is required */
  required: boolean;
  /** The plan of the field above rendering the same id */
  inherited?: FieldPresentation;
}

/** Whether the options of a field's `anyOf`/`oneOf` are taken to render no control under the field's id for a label's
 * `for` to name: each is an object, an array or a `null`, so the field's label is drawn with no `for` and names what
 * it names through `aria-labelledby`. An array counts whatever its widget, since the option's widget isn't resolved
 * here, so a multi-select or file array's control, which does carry the field's id, is named by the label through
 * `aria-labelledby`, as the selector is. An option naming no type renders with the field's, as
 * `getRenderedOptionSchema()` gives it. An option given by a `$ref` isn't resolved here and counts as one that may
 * render a control
 *
 * @param schema - The schema of the field rendering the options
 * @param xxxOfKey - The keyword its options are under
 * @returns - True when every option is an object, an array or a `null`
 */
function optionsRenderNoControl<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  xxxOfKey: typeof ANY_OF_KEY | typeof ONE_OF_KEY,
) {
  const options: unknown = schema[xxxOfKey];
  const fieldType = getSchemaType<S>(schema);
  return (
    Array.isArray(options) &&
    options.length > 0 &&
    options.every((option) => {
      if (!isObject(option) || Object.hasOwn(option, REF_KEY)) {
        return false;
      }
      const type = getSchemaType<S>(option as S) ?? fieldType;
      return type === 'object' || type === 'array' || type === 'null';
    })
  );
}

/** Whether the field renders a control for a template label to name
 *
 * @param field - The field component planned
 * @param widget - The single widget it renders, if any
 * @param registry - The registry, whose `fields`, `globalFormOptions`, `schemaUtils` and `globalUiOptions` are read
 * @param schema - The schema the field renders
 * @param uiSchema - The uiSchema the field renders
 * @returns - False for a container, `NullField`, or `FallbackField` rendering the unsupported-field template, or a
 *   value its own field labels, true otherwise, a custom field included
 */
function rendersControl<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  field: Field<T, S, F>,
  widget: Widget<T, S, F> | string | undefined,
  registry: Registry<T, S, F>,
  schema: S,
  uiSchema: UiSchema<T, S, F>,
) {
  const { fields, globalFormOptions } = registry;
  if (field === fields.ArrayField) {
    return widget !== undefined;
  }
  if (field === fields.FallbackField) {
    // The fallback UI labels its value from outside by the same call it makes to decide that, and otherwise leaves the
    // value field to draw its own heading or label. That call takes any `ui:field` for a custom field drawing its own
    // label, but this field is already the one it resolved to, which a `ui:field` naming nothing renders too, so this
    // call clears the key and its spelling doesn't move the label. `FallbackField`'s own call passes any field named in
    // `ui:field`, `ui:options.field` or `ui:globalOptions.field` as the key, since only a caller's own field renders it
    // without a plan, and that field draws no label of its own. The call still matches `ui:widget` by name (#5581)
    return (
      Boolean(globalFormOptions.useFallbackUiForUnsupportedType) &&
      displaysLabel<T, S, F>(registry, schema, { ...uiSchema, [UI_FIELD_KEY]: undefined })
    );
  }
  return !CONTROLLESS_FIELD_KEYS.some((key) => fields[key] === field);
}

/** Builds the plan of a field `SchemaField` renders, memoised on what it reads, so a render that changes none of it
 * hands every template and widget the same plan (#5490 decision 19)
 *
 * @param inputs - What `SchemaField` has decided about the field
 * @returns - The plan, or undefined when no field renders, and where its declaration places a label the field or its
 *   widget draws itself, which no template or widget reads, only the array item holding the field
 */
export default function useSchemaFieldPresentation<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  inputs: SchemaFieldPresentationInputs<T, S, F>,
): { presentation: FieldPresentation | undefined; labelPlacement: ResolvedPresentationDeclaration['labelPlacement'] } {
  const {
    id,
    componentId,
    registry,
    schema,
    uiSchema,
    field,
    fieldKey,
    xxxOfKey,
    label,
    showLabel,
    description,
    help,
    errors,
    hideError,
    hidden,
    required,
    inherited,
  } = inputs;
  const { fields, globalFormOptions } = registry;
  let plannedField = field;
  let plannedKey = fieldKey;
  if (xxxOfKey !== undefined) {
    const isAnyOf = xxxOfKey === ANY_OF_KEY;
    plannedField = isAnyOf ? fields.AnyOfField : fields.OneOfField;
    plannedKey = isAnyOf ? 'AnyOfField' : 'OneOfField';
  }
  const widget = useMemo(
    () => (field && xxxOfKey === undefined ? getFieldWidget<T, S, F>(field, schema, uiSchema, registry) : undefined),
    [field, xxxOfKey, schema, uiSchema, registry],
  );
  // Memoized, since a `FallbackField` asks `getDisplayLabel()`
  const hasControl = useMemo(
    () =>
      plannedField !== undefined &&
      !hidden &&
      rendersControl<T, S, F>(plannedField, widget, registry, schema, uiSchema),
    [plannedField, hidden, widget, registry, schema, uiSchema],
  );
  const fallbackDrawsNoControl = plannedField === fields.FallbackField && !hidden && !hasControl;
  const usesFallbackUi = Boolean(globalFormOptions.useFallbackUiForUnsupportedType);
  const arrayMissesItems = plannedField === fields.ArrayField && !hidden && !(ITEMS_KEY in schema);
  const rendersUnsupportedTemplate = (fallbackDrawsNoControl || arrayMissesItems) && !usesFallbackUi;
  // A field with no control of its own to name hands its label and description to the field below it rendering the same
  // id, which draws them as its heading: the field rendering withheld options, and the fallback UI's field while its
  // value is one that draws its own heading or label
  const handsLabelDown = xxxOfKey === undefined ? fallbackDrawsNoControl && usesFallbackUi : hidden;
  const declaration = useMemo(() => {
    if (!plannedField) {
      return undefined;
    }
    const declared = getPresentationDeclaration<T, S, F>(registry, {
      schema,
      field: plannedField,
      fieldKey: plannedKey,
      widget,
    });
    // The label and the description go to the field below, whatever the field declares, so the label isn't drawn where
    // it has no control to name, and the description isn't drawn above the heading it describes
    if (handsLabelDown) {
      return { ...declared, label: 'template' as const, description: 'template' as const };
    }
    // The unsupported-field template has no control for a label to name, so `FallbackField`, or an array with no
    // `items`, draws its title and description itself, above it, as `NullField` does
    if (rendersUnsupportedTemplate) {
      return { ...declared, label: 'self' as const, description: 'self' as const };
    }
    if (xxxOfKey === undefined) {
      return declared;
    }
    // A `for` at the field's id is taken to name nothing where every option is taken to render no control there, so
    // the label names through `aria-labelledby` any control an option does render there, as a multi-select or file
    // array does
    return optionsRenderNoControl<S>(schema, xxxOfKey)
      ? { ...declared, labelledBy: 'aria-labelledby' as const }
      : declared;
  }, [registry, schema, plannedField, plannedKey, widget, xxxOfKey, handsLabelDown, rendersUnsupportedTemplate]);
  // A control holding `false` left alone, as an unchecked checkbox does, would fail the browser's own check of a native
  // `required` for a value the schema accepts, so it is required, by its attribute and its marker alike, only where the
  // schema demands `true` (#5388). It holds that `false` only where `getDefaultFormState()` seeds it, which it does by
  // the type the field renders: rendered as another type, as a `type` list's string field renders one, an unchecked
  // box answers nothing
  const controlRequired = useMemo(
    () =>
      required &&
      (!declaration?.uncheckedIsFalse ||
        getFieldTypeForUiSchema<T, S, F>(schema, uiSchema) !== 'boolean' ||
        schemaRequiresTrueValue<S>(schema)),
    [required, declaration, schema, uiSchema],
  );
  const presentation = useMemo(() => {
    if (!declaration) {
      return undefined;
    }
    const plan = resolveFieldPresentation({
      id,
      componentId,
      declaration,
      label,
      showLabel,
      description,
      help,
      errors,
      hideError,
      hasControl,
      required: controlRequired,
      inherited,
    });
    // The label has no control to name and the field below draws it as its heading, so the description goes undrawn here
    // too, for the field below to draw beneath that heading rather than the template above it
    if (!handsLabelDown || plan.description.by !== 'template') {
      return plan;
    }
    return {
      ...plan,
      description: { ...plan.description, by: 'none' as const },
      ...withoutDescribers(plan, new Set([plan.description.id])),
    };
  }, [
    id,
    componentId,
    declaration,
    label,
    showLabel,
    description,
    help,
    errors,
    hideError,
    hasControl,
    controlRequired,
    inherited,
    handsLabelDown,
  ]);
  return { presentation, labelPlacement: declaration?.labelPlacement };
}
