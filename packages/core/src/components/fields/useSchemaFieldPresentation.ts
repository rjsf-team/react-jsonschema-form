import type { ReactElement } from 'react';
import { useMemo } from 'react';
import type {
  Field,
  FieldPresentation,
  FormContextType,
  ONE_OF_KEY,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Widget,
} from '@rjsf/utils';
import { ANY_OF_KEY, getPresentationDeclaration, resolveFieldPresentation, schemaRequiresTrueValue } from '@rjsf/utils';

import getFieldWidget, { displaysLabel } from './fieldWidgetUtils.ts';

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
    // value field to draw its own heading or label
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
 * @returns - The plan, or undefined when no field renders
 */
export default function useSchemaFieldPresentation<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(inputs: SchemaFieldPresentationInputs<T, S, F>): FieldPresentation | undefined {
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
  const { fields } = registry;
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
    // The field rendering the options draws its label only through its selector, so with the selector withheld, as for
    // an opted-out optional field, there is no label of its own, and the field below keeps the heading it draws
    return xxxOfKey !== undefined && hidden ? { ...declared, label: 'template' as const } : declared;
  }, [registry, schema, plannedField, plannedKey, widget, xxxOfKey, hidden]);
  // A control holding `false` left alone, as an unchecked checkbox does, would fail the browser's own check of a native
  // `required` for a value the schema accepts, so it is required, by its attribute and its marker alike, only where the
  // schema demands `true` (#5388)
  const controlRequired = useMemo(
    () => required && (!declaration?.uncheckedIsFalse || schemaRequiresTrueValue<S>(schema)),
    [required, declaration, schema],
  );
  // Memoized, since a `FallbackField` asks `getDisplayLabel()`
  const hasControl = useMemo(
    () =>
      plannedField !== undefined &&
      !hidden &&
      rendersControl<T, S, F>(plannedField, widget, registry, schema, uiSchema),
    [plannedField, hidden, widget, registry, schema, uiSchema],
  );
  return useMemo(() => {
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
    // With the selector withheld, the label has no control to name and the option below draws it as its heading, so the
    // description goes undrawn here too, for the option to draw beneath that heading rather than the template above it
    if (xxxOfKey === undefined || !hidden || plan.description.by !== 'template') {
      return plan;
    }
    const descriptionId = plan.description.id;
    return {
      ...plan,
      description: { ...plan.description, by: 'none' as const },
      describedBy: plan.describedBy.filter((describer) => describer !== descriptionId),
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
    xxxOfKey,
    hidden,
  ]);
}
