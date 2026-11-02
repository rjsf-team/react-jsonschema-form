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
  getOptionUiSchema,
  getPresentationDeclaration,
  getRenderedOptionSchema,
  getSchemaType,
  getUiOptions,
  getXxxOfKey,
  ITEMS_KEY,
  resolveFieldPresentation,
  schemaRequiresTrueValue,
} from '@rjsf/utils';

import getFieldWidget, { COMPONENT_TYPES, displaysLabel, withoutDescribers } from './fieldWidgetUtils.ts';

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
  /** The `anyOf`/`oneOf` options `SchemaField` retrieved for the field's data, undefined where it renders none */
  options: readonly S[] | undefined;
  /** The index of the option shown, -1 for none */
  selectedOption: number;
}

/** How the label of a field rendering its `anyOf`/`oneOf` options reaches the control the selected option renders
 * under the field's id: by its `for`, unless the option renders no control there, as an object, a `null` or an array of
 * items does, or one a `for` can't name, as the group of an alt-date's parts is, so the label names it through
 * `aria-labelledby` instead (#5578). An option naming a `ui:field`, options of its own or no type with a field of its
 * own keeps the `for`, unresolved here: options of its own may show an object, and an untyped option may render nothing
 * under the field's id, either of which leaves the `for` naming no control (#5709)
 *
 * @param registry - The registry, whose `fields` and `presentation` are read
 * @param schema - The schema of the field rendering the options
 * @param uiSchema - Its uiSchema, whose `anyOf`/`oneOf` entry gives the option's
 * @param xxxOfKey - The keyword its options are under
 * @param option - The option shown, retrieved for the field's data, if one is
 * @param index - Its index among the options
 * @returns - How the label reaches the selected option's control
 */
function selectedOptionLabelledBy<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  registry: Registry<T, S, F>,
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  xxxOfKey: typeof ANY_OF_KEY | typeof ONE_OF_KEY,
  option: S | undefined,
  index: number,
): ResolvedPresentationDeclaration['labelledBy'] {
  if (!option) {
    return 'aria-labelledby';
  }
  const rendered = getRenderedOptionSchema<S>(schema, option);
  const optionUiSchema = getOptionUiSchema<T, S, F>(uiSchema, xxxOfKey, index);
  const type = getSchemaType<S>(rendered);
  if (
    getUiOptions<T, S, F>(optionUiSchema).field ||
    getXxxOfKey<S>(rendered) ||
    typeof type !== 'string' ||
    !Object.hasOwn(COMPONENT_TYPES, type)
  ) {
    return 'for';
  }
  const fieldKey = COMPONENT_TYPES[type];
  const field = registry.fields[fieldKey];
  const widget = getFieldWidget<T, S, F>(field, rendered, optionUiSchema, registry);
  if (!rendersControl<T, S, F>(field, widget, registry, rendered, optionUiSchema ?? {})) {
    return 'aria-labelledby';
  }
  return getPresentationDeclaration<T, S, F>(registry, { schema: rendered, field, fieldKey, widget }).labelledBy;
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
    // The fallback UI labels its value from outside where this call says the value is a control, and otherwise leaves
    // the value field to draw its own heading or label. The call matches `ui:widget` by name (#5581)
    return (
      Boolean(globalFormOptions.useFallbackUiForUnsupportedType) && displaysLabel<T, S, F>(registry, schema, uiSchema)
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
    options,
    selectedOption,
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
  // Keyed on the option shown rather than the list, which is retrieved afresh with every change of the data while each
  // option keeps its identity, and a string, so the declaration keeps its own
  const rendersOptions = options !== undefined;
  const option = options?.[selectedOption];
  const optionLabelledBy = useMemo(
    () =>
      xxxOfKey !== undefined && rendersOptions
        ? selectedOptionLabelledBy<T, S, F>(registry, schema, uiSchema, xxxOfKey, option, selectedOption)
        : undefined,
    [registry, schema, uiSchema, xxxOfKey, rendersOptions, option, selectedOption],
  );
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
    return optionLabelledBy ? { ...declared, labelledBy: optionLabelledBy } : declared;
  }, [
    registry,
    schema,
    plannedField,
    plannedKey,
    widget,
    handsLabelDown,
    rendersUnsupportedTemplate,
    optionLabelledBy,
  ]);
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
