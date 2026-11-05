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
  getSchemaOwnTypes,
  getUiOptions,
  guessType,
  ITEMS_KEY,
  resolveFieldPresentation,
  schemaRequiresTrueValue,
  uiBooleanOption,
} from '@rjsf/utils';

import getFieldWidget, {
  displaysLabel,
  fallbackValueKeepsWidget,
  getBooleanFieldWidget,
  withoutDescribers,
} from './fieldWidgetUtils.ts';

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
  /** The field the `anyOf`/`oneOf` option shown renders with, null where the field renders its options and none renders
   * under its id. Undefined where it renders none, or the option is a `$ref` cycle, which names no field
   */
  shownOptionField?: ShownOptionField<T, S, F> | null;
  /** The field's form data, which says the type of the value a type selector below a field above is on, and whether the
   * option shown holds a value
   */
  formData?: unknown;
}

/** The field the `anyOf`/`oneOf` option shown renders with, as `SchemaField` resolves the option's own `SchemaField` */
export interface ShownOptionField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The field component the option renders */
  field: Field<T, S, F>;
  /** The registry key that named it, if one did */
  fieldKey: string | undefined;
  /** The schema it renders */
  schema: S;
  /** The uiSchema it renders */
  uiSchema: UiSchema<T, S, F>;
  /** The single widget it renders, if any */
  widget: Widget<T, S, F> | string | undefined;
  /** Whether it renders hidden */
  hidden: boolean;
  /** Whether it renders an option selector of its own, for options of its own */
  rendersOptionSelector: boolean;
}

/** How the label of a field rendering its `anyOf`/`oneOf` options reaches the control the option shown renders under
 * the field's id: by its `for`, unless the option renders no control there, as an object, a `null`, an array of items
 * or a hidden field does, or one a `for` can't name, as the group of an alt-date's parts is, so the label names it
 * through `aria-labelledby` instead (#5578). An option rendering options of its own is named that way too, since the
 * option it shows may be an object, whose `<fieldset>` a `for` can't name, and a control it shows is named by the label
 * all the same
 *
 * @param registry - The registry, whose `fields` and `presentation` are read
 * @param option - The field the option shown renders with, null where none renders under the field's id
 * @returns - How the label reaches the option's control
 */
function shownOptionLabelledBy<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  registry: Registry<T, S, F>,
  option: ShownOptionField<T, S, F> | null,
): ResolvedPresentationDeclaration['labelledBy'] {
  if (!option || option.hidden || option.rendersOptionSelector) {
    return 'aria-labelledby';
  }
  const { field, fieldKey, schema, uiSchema, widget } = option;
  if (!rendersControl<T, S, F>(field, widget, registry, schema, uiSchema)) {
    return 'aria-labelledby';
  }
  return getPresentationDeclaration<T, S, F>(registry, { schema, field, fieldKey, widget }).labelledBy;
}

/** Whether the field renders a control for a template label to name
 *
 * @param field - The field component planned
 * @param widget - The single widget it renders, if any
 * @param registry - The registry, whose `fields`, `widgets`, `presentation`, `globalFormOptions`, `schemaUtils` and
 *   `globalUiOptions` are read
 * @param schema - The schema the field renders
 * @param uiSchema - The uiSchema the field renders
 * @param [headingType] - The type with a heading of its own that a `FallbackField`'s value holds, if any
 * @returns - False for a container, `NullField`, or `FallbackField` rendering the unsupported-field template, or a
 *   value it hands its label and description down to, true otherwise, a custom field included
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
  headingType?: 'object' | 'array',
) {
  const { fields, globalFormOptions } = registry;
  if (field === fields.ArrayField) {
    return widget !== undefined;
  }
  if (field === fields.FallbackField) {
    if (!globalFormOptions.useFallbackUiForUnsupportedType) {
      return false;
    }
    // The fallback UI labels its value from outside when the value is a control, and otherwise leaves the value field to
    // draw its own heading or label
    const valueSchema =
      headingType && getSchemaOwnTypes<S>(schema)?.includes(headingType) ? { ...schema, type: headingType } : schema;
    // A boolean's widget decides by its declaration, so every name it goes by gets the same answer. Only a boolean: a
    // text input declared as labelling itself keeps its description with the field around the type selector
    if (getFieldTypeForUiSchema<T, S, F>(valueSchema, uiSchema) !== 'boolean') {
      return displaysLabel<T, S, F>(registry, valueSchema, uiSchema);
    }
    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    const { label } = { ...registry.globalUiOptions, ...uiOptions };
    if (uiBooleanOption(label) === false) {
      return false;
    }
    const value = getPresentationDeclaration<T, S, F>(registry, {
      schema: { ...schema, type: 'boolean' },
      field: fields.BooleanField,
      fieldKey: 'BooleanField',
      widget: getBooleanFieldWidget<T, S, F>(
        fallbackValueKeepsWidget<T, S, F>(schema, 'boolean', uiOptions.widget, registry.widgets) ? uiOptions : {},
      ),
    });
    // A `FallbackField` drawing its own label leaves no template label at stake, so there the answer only places the
    // description: a control with its label beside it hands it down, to go with that label, and a radio or select keeps
    // it with the field, as a text input does
    return (
      value.label === 'template' ||
      (value.labelPlacement !== 'beside' &&
        getPresentationDeclaration<T, S, F>(registry, { schema, field, fieldKey: 'FallbackField' }).label === 'self')
    );
  }
  return !CONTROLLESS_FIELD_KEYS.some((key) => fields[key] === field);
}

/** Whether a required control left alone fails the form, and so says it is required. A control holding `false` left alone,
 * as an unchecked checkbox does, would fail the browser's own check of a native `required` for a value the schema
 * accepts, so it is required, by its attribute and its marker alike, only where the schema demands `true` (#5388). It
 * holds that `false` only where `getDefaultFormState()` seeds it, which it does by the type the field renders: rendered as
 * another type, as a `type` list's string field renders one, an unchecked box answers nothing. A group of checkboxes left
 * alone holds an empty array likewise, which only `minItems` or `ui:required` turns down (#5573)
 *
 * @param declaration - The declaration of the control
 * @param schema - The schema it renders
 * @param uiSchema - The uiSchema it renders
 * @param registry - The registry, whose `widgets` are read
 * @returns - False where the form accepts the value the control holds left alone
 */
function demandsAnswer<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  declaration: ResolvedPresentationDeclaration | undefined,
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  registry: Registry<T, S, F>,
) {
  return (
    (!declaration?.uncheckedIsFalse ||
      getFieldTypeForUiSchema<T, S, F>(schema, uiSchema, registry.widgets) !== 'boolean' ||
      schemaRequiresTrueValue<S>(schema)) &&
    (!declaration?.uncheckedIsEmpty ||
      (schema.minItems ?? 0) >= 1 ||
      uiBooleanOption(getUiOptions<T, S, F>(uiSchema).required) === true)
  );
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
    shownOptionField,
    formData,
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
  // A type selector within an `anyOf`/`oneOf` option renders below the option's selector, so an option holding an object
  // or an array draws its description under its heading, below that selector, as it does beneath a selector around them
  const heldType = guessType(formData);
  const headingType = inherited && (heldType === 'object' || heldType === 'array') ? heldType : undefined;
  // Memoized, since a `FallbackField` asks `getDisplayLabel()` or looks up its boolean's widget
  const hasControl = useMemo(
    () =>
      plannedField !== undefined &&
      !hidden &&
      rendersControl<T, S, F>(plannedField, widget, registry, schema, uiSchema, headingType),
    [plannedField, hidden, widget, registry, schema, uiSchema, headingType],
  );
  const fallbackDrawsNoControl = plannedField === fields.FallbackField && !hidden && !hasControl;
  const usesFallbackUi = Boolean(globalFormOptions.useFallbackUiForUnsupportedType);
  const arrayMissesItems = plannedField === fields.ArrayField && !hidden && !(ITEMS_KEY in schema);
  const rendersUnsupportedTemplate = (fallbackDrawsNoControl || arrayMissesItems) && !usesFallbackUi;
  // A field with no control of its own to name hands its label and description to the field below it rendering the same
  // id, which draws them as its heading: the field rendering withheld options, and the fallback UI's field while its
  // value is one that draws its own heading or label
  const handsLabelDown = xxxOfKey === undefined ? fallbackDrawsNoControl && usesFallbackUi : hidden;
  // A string, so a new plan of the option shown that labels it the same way, as the option shown changing for another
  // of the same kind, leaves the declaration as it was
  const optionLabelledBy = useMemo(
    () => (shownOptionField === undefined ? undefined : shownOptionLabelledBy<T, S, F>(registry, shownOptionField)),
    [shownOptionField, registry],
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
    // A declared `aria-labelledby` is kept, since it never leaves a `for` naming an element a `for` can't label
    return optionLabelledBy && declared.labelledBy !== 'aria-labelledby'
      ? { ...declared, labelledBy: optionLabelledBy }
      : declared;
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
  // A field rendering its options is required as the option shown is, since that option's control holds its value. An
  // option holding nothing fails the form whatever its control accepts left alone, as a checkbox just switched to does,
  // which nothing seeds a `false` for
  const holdsNoValue = formData === undefined;
  const controlRequired = useMemo(() => {
    // An option drawing the unsupported-field template has no control to answer its own `ui:required` with, and the field
    // above marks the label where the field is required
    if (!shownOptionField) {
      return (
        required &&
        !(rendersUnsupportedTemplate && inherited !== undefined) &&
        demandsAnswer<T, S, F>(declaration, schema, uiSchema, registry)
      );
    }
    const { field: optionField, schema: optionSchema, uiSchema: optionUiSchema } = shownOptionField;
    // An option's own `ui:required` asks nothing of a `null`, or of a schema with no type that renders the
    // unsupported-field template, since neither has a control to answer it with
    const rendersAnswer =
      optionField !== registry.fields.NullField &&
      (optionField !== registry.fields.FallbackField ||
        Boolean(registry.globalFormOptions.useFallbackUiForUnsupportedType));
    return (
      (uiBooleanOption(getUiOptions<T, S, F>(optionUiSchema).required) ?? required) &&
      (required || rendersAnswer) &&
      (holdsNoValue ||
        demandsAnswer<T, S, F>(
          getPresentationDeclaration<T, S, F>(registry, shownOptionField),
          optionSchema,
          optionUiSchema,
          registry,
        ))
    );
  }, [
    required,
    rendersUnsupportedTemplate,
    inherited,
    declaration,
    schema,
    uiSchema,
    registry,
    shownOptionField,
    holdsNoValue,
  ]);
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
