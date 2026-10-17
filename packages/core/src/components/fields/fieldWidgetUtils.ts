import type {
  EnumOptionsType,
  Field,
  FieldPresentation,
  FieldTemplateProps,
  FormContextType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Widget,
  WidgetProps,
} from '@rjsf/utils';
import { getUiOptions, isCustomWidget, isFixedItems, ITEMS_KEY, resolveDefaultWidget } from '@rjsf/utils';

/** How `ArrayField` renders an array: as one widget (`multiSelect`, `customWidget`, `files`), as a list of items
 * (`fixed`, `normal`), or as the unsupported-field template when the schema declares no `items`
 */
export type ArrayFieldMode = 'unsupported' | 'multiSelect' | 'customWidget' | 'fixed' | 'files' | 'normal';

/** Decides how `ArrayField` renders `schema`, which `SchemaField` also reads to plan the field, so the two can't tell
 * the array apart
 *
 * @param schema - The schema of the array
 * @param uiSchema - The uiSchema of the array
 * @param registry - The registry, whose `schemaUtils` and `globalFormOptions` are read
 * @returns - How the array renders
 */
export function getArrayFieldMode<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiSchema: UiSchema<T, S, F> | undefined, registry: Registry<T, S, F>): ArrayFieldMode {
  const { schemaUtils, globalFormOptions } = registry;
  const isMissingItems = !(ITEMS_KEY in schema);
  if (isMissingItems && !globalFormOptions.useFallbackUiForUnsupportedType) {
    return 'unsupported';
  }
  // An items schema with type as undefined triggers FallbackField later on
  const arraySchema = isMissingItems ? { ...schema, [ITEMS_KEY]: { type: undefined } } : schema;
  if (schemaUtils.isMultiSelect(arraySchema)) {
    return 'multiSelect';
  }
  if (isCustomWidget<T, S, F>(uiSchema)) {
    return 'customWidget';
  }
  if (isFixedItems(arraySchema)) {
    return 'fixed';
  }
  if (schemaUtils.isFilesArray(arraySchema, uiSchema)) {
    return 'files';
  }
  return 'normal';
}

/** The widget each widget-rendering mode of `ArrayField` falls back to when the `uiSchema` names none, which
 * `ArrayField` renders with and `getArrayFieldWidget()` plans with
 */
export const ARRAY_MODE_DEFAULT_WIDGETS: Readonly<Record<'multiSelect' | 'files', string>> = {
  multiSelect: 'select',
  files: 'files',
};

/** Gets the widget `StringField`, and `NumberField` through it, renders a string with: the field's own `ui:widget`, or
 * the default `resolveDefaultWidget()` picks for the schema, along with the `enumOptions` it computed on the way
 *
 * @param schema - The schema of the field
 * @param uiSchema - The uiSchema of the field
 * @param registry - The registry, whose `schemaUtils` and `widgets` are read
 * @returns - The widget and the `enumOptions`, if the schema is a select
 */
export function resolveStringFieldWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  registry: Registry<T, S, F>,
): { widget: Widget<T, S, F> | string; enumOptions: EnumOptionsType<S>[] | undefined } {
  const { defaultWidget, enumOptions } = resolveDefaultWidget<T, S, F>(
    schema,
    uiSchema,
    registry.schemaUtils,
    registry.widgets,
  );
  const { widget = defaultWidget } = getUiOptions<T, S, F>(uiSchema);
  return { widget, enumOptions };
}

/** Gets the widget `BooleanField` renders with: its `ui:widget`, `ui:globalOptions` included, or a checkbox for none
 * or a `null` one
 *
 * @param uiSchema - The uiSchema of the field
 * @param registry - The registry, whose `globalUiOptions` are read
 * @returns - The widget
 */
export function getBooleanFieldWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> | undefined, registry: Registry<T, S, F>): Widget<T, S, F> | string {
  return getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions).widget ?? 'checkbox';
}

/** Gets the single widget `ArrayField` renders an array with, or `undefined` when it renders a list of items or the
 * unsupported-field template
 *
 * @param schema - The schema of the array
 * @param uiSchema - The uiSchema of the array
 * @param registry - The registry
 * @returns - The widget, if the array renders as one
 */
export function getArrayFieldWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  registry: Registry<T, S, F>,
): Widget<T, S, F> | string | undefined {
  const mode = getArrayFieldMode<T, S, F>(schema, uiSchema, registry);
  if (mode !== 'multiSelect' && mode !== 'customWidget' && mode !== 'files') {
    return undefined;
  }
  const { widget = mode === 'customWidget' ? undefined : ARRAY_MODE_DEFAULT_WIDGETS[mode] } = getUiOptions<T, S, F>(
    uiSchema,
    registry.globalUiOptions,
  );
  return widget;
}

/** Whether a widget is told to hide its label: unless its plan has it draw the label. A field with no label text has
 * none for anyone to draw, and there it says whether the widget draws the description, which a widget that keys its
 * description on `hideLabel` still has to draw
 *
 * @param presentation - The plan of the field the widget renders the value of
 * @returns - The `hideLabel` the widget receives
 */
function hidesWidgetLabel({ label, description }: FieldPresentation): boolean {
  if (label.by === 'none') {
    return description.by !== 'self';
  }
  return label.by !== 'self';
}

/** Whether a field rendered without a plan shows its label, as the deprecated `getDisplayLabel()` decides. The one
 * place core asks it, for the deprecated props a field without a plan hands on, the fallback UI's labelling and the
 * `displayLabel` an `ArrayFieldItemTemplate` lays its toolbar out by
 *
 * @param registry - The registry's `schemaUtils` and `globalUiOptions`
 * @param schema - The field's schema
 * @param [uiSchema] - The field's uiSchema
 * @returns - True when the field shows its label
 */
export function displaysLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  { schemaUtils, globalUiOptions }: Pick<Registry<T, S, F>, 'schemaUtils' | 'globalUiOptions'>,
  schema: S,
  uiSchema?: UiSchema<T, S, F>,
): boolean {
  return schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
}

/** Gets the `label` and deprecated `hideLabel` a field hands the widget it renders, for the widget to spread: the
 * field's label from its plan, whoever draws it, and whether the widget draws it, or, for a field rendered without a
 * plan, the field's own label and whether `displaysLabel()` shows it. The one place a field sets `hideLabel`
 *
 * @param presentation - The field's plan, if `SchemaField` built one
 * @param ownLabel - The label the field computes for itself, used without a plan
 * @param showsLabel - Whether the field shows its label without a plan, called only then
 * @returns - The `label` and `hideLabel` for the widget
 */
export function getWidgetLabelProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  presentation: FieldPresentation | undefined,
  ownLabel: string,
  showsLabel: () => boolean,
): Pick<WidgetProps<T, S, F>, 'label' | 'hideLabel'> {
  const hideLabel = presentation ? hidesWidgetLabel(presentation) : !showsLabel();
  return { label: presentation ? presentation.label.text : ownLabel, hideLabel };
}

/** Gets the parts of a field's plan its template draws, from which the deprecated props a template that doesn't read
 * `presentation` renders from are derived, so it draws a part exactly where the plan says the template draws it
 *
 * @param presentation - The field's plan, if one was built
 * @returns - The description, help and error messages the template draws, if any
 */
export function getTemplateParts(presentation: FieldPresentation | undefined) {
  return {
    description: presentation?.description.by === 'template' ? presentation.description : undefined,
    help: presentation?.help.by === 'template' ? presentation.help.text : undefined,
    errors: presentation?.errors.by === 'template' ? presentation.errors.messages : undefined,
  };
}

/** Gets the deprecated `displayLabel` and `rawErrors` a field hands its template, for a template that doesn't read
 * `presentation`: whether its plan has the template draw the label, and the field's errors unless `ui:hideError` hides
 * them. The one place core sets them
 *
 * @param presentation - The field's plan, if one was built
 * @param errors - The field's own error messages
 * @param hideError - Whether `ui:hideError` hides the field's errors
 * @returns - The `displayLabel` and `rawErrors` for the template
 */
export function getDeprecatedTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  presentation: FieldPresentation | undefined,
  errors: string[] | undefined,
  hideError: boolean | undefined,
): Pick<FieldTemplateProps<T, S, F>, 'displayLabel' | 'rawErrors'> {
  const displayLabel = presentation?.label.by === 'template';
  const rawErrors = hideError ? undefined : errors;
  return { displayLabel, rawErrors };
}

/** Gets the single widget the field component renders its value with, as the field itself picks it, so `SchemaField`
 * plans the field with the widget the field renders rather than predicting one. A component registered under one of
 * core's widget-rendering field keys is taken to pick its widget the way core's does; any other renders no single
 * widget `SchemaField` can know of
 *
 * @param field - The field component `SchemaField` renders
 * @param schema - The schema it renders
 * @param uiSchema - The uiSchema it renders
 * @param registry - The registry
 * @returns - The widget, if the field renders one
 */
export default function getFieldWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  field: Field<T, S, F>,
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  registry: Registry<T, S, F>,
): Widget<T, S, F> | string | undefined {
  const { fields } = registry;
  if (field === fields.StringField || field === fields.NumberField) {
    return resolveStringFieldWidget<T, S, F>(schema, uiSchema, registry).widget;
  }
  if (field === fields.BooleanField) {
    return getBooleanFieldWidget<T, S, F>(uiSchema, registry);
  }
  if (field === fields.ArrayField) {
    return getArrayFieldWidget<T, S, F>(schema, uiSchema, registry);
  }
  return undefined;
}
