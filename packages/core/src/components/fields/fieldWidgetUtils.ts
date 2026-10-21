import type {
  ContainerFieldTemplateProps,
  EnumOptionsType,
  Field,
  FieldPath,
  FieldPresentation,
  FieldProps,
  FieldTemplateProps,
  FormContextType,
  GlobalUISchemaOptions,
  Registry,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UIOptionsType,
  Widget,
  WidgetProps,
} from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  fieldPathEndsWithIndex,
  getDescribedControlAttributes,
  getUiOptions,
  isCustomWidget,
  isFixedItems,
  ITEMS_KEY,
  resolveDefaultWidget,
  UI_GLOBAL_OPTIONS_KEY,
  uiBooleanOption,
} from '@rjsf/utils';

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
  if (!(ITEMS_KEY in schema) && !globalFormOptions.useFallbackUiForUnsupportedType) {
    return 'unsupported';
  }
  const arraySchema = withFallbackItems<S>(schema);
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

/** Gets the schema `ArrayField` renders an array with: one that declares no `items` takes an items schema with no type,
 * which the fallback UI renders through `FallbackField`
 *
 * @param schema - The schema of the array
 * @returns - The schema, with an untyped `items` where it declares none
 */
export function withFallbackItems<S extends StrictRJSFSchema = RJSFSchema>(schema: S): S {
  return ITEMS_KEY in schema ? schema : { ...schema, [ITEMS_KEY]: { type: undefined } };
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
 * @param [uiOptions] - The field's ui options, where its caller has read them already
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
  uiOptions: UIOptionsType<T, S, F> = getUiOptions<T, S, F>(uiSchema),
): { widget: Widget<T, S, F> | string; enumOptions: EnumOptionsType<S>[] | undefined } {
  const { defaultWidget, enumOptions } = resolveDefaultWidget<T, S, F>(
    schema,
    uiSchema,
    registry.schemaUtils,
    registry.widgets,
  );
  const { widget = defaultWidget } = uiOptions;
  return { widget, enumOptions };
}

/** Gets the widget `BooleanField` renders with: its `ui:widget`, `ui:globalOptions` included, or a checkbox for none
 * or a `null` one
 *
 * @param uiOptions - The field's ui options, read with the registry's `globalUiOptions`
 * @returns - The widget
 */
export function getBooleanFieldWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiOptions: UIOptionsType<T, S, F>): Widget<T, S, F> | string {
  return uiOptions.widget ?? 'checkbox';
}

/** Gets the single widget `ArrayField` renders an array with, or `undefined` when it renders a list of items or the
 * unsupported-field template
 *
 * @param schema - The schema of the array
 * @param uiSchema - The uiSchema of the array
 * @param registry - The registry
 * @returns - The widget, if the array renders as one
 */
function getArrayFieldWidget<
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
 * place core asks it, for the deprecated props a field without a plan hands on and the fallback UI's labelling
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
  // oxlint-disable-next-line typescript/no-deprecated -- kept through v7, and nothing in the plan answers it for those callers
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
  // oxlint-disable-next-line typescript/no-deprecated -- set for a widget that doesn't read `presentation`
  return { label: presentation ? presentation.label.text : ownLabel, hideLabel };
}

/** Gets the deprecated `rawErrors` a field hands the widget it renders, for a widget that doesn't read `presentation`:
 * the field's own error messages, whatever `ui:hideError` says, so the widget can render them its own way. The one
 * place a field sets them
 *
 * @param rawErrors - The field's own error messages
 * @returns - The `rawErrors` for the widget
 */
export function getWidgetErrorProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(rawErrors: string[] | undefined): Pick<WidgetProps<T, S, F>, 'rawErrors'> {
  // oxlint-disable-next-line typescript/no-deprecated -- set for a widget that doesn't read `presentation`
  return { rawErrors };
}

/** Gets the deprecated `rawErrors` a field hands the field component it renders, for one that doesn't read
 * `presentation`: the field's own error messages, whatever `ui:hideError` says, so the component can render them its
 * own way, except that `ArrayField` hands each item's `ArraySchemaField` the array's own, as it always has. The one
 * place a field component is handed them
 *
 * @param rawErrors - The field's own error messages, or, for an array's item, the array's
 * @returns - The `rawErrors` for the field component
 */
export function getFieldErrorProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(rawErrors: string[] | undefined): Pick<FieldProps<T, S, F>, 'rawErrors'> {
  // oxlint-disable-next-line typescript/no-deprecated -- set for a field component that doesn't read `presentation`
  return { rawErrors };
}

/** Gets the deprecated `rawErrors` an array or object hands its container template, for one that doesn't read
 * `presentation`: the container's own error messages, whatever `ui:hideError` says, as a widget is handed them. The one
 * place a container template is handed them
 *
 * @param rawErrors - The container's own error messages
 * @returns - The `rawErrors` for the container template
 */
export function getContainerErrorProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(rawErrors: string[] | undefined): Pick<ContainerFieldTemplateProps<T, S, F>, 'rawErrors'> {
  // oxlint-disable-next-line typescript/no-deprecated -- set for a container template that doesn't read `presentation`
  return { rawErrors };
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

/** Whether `schema` is the stub `retrieveSchema()` makes for an additional property, by the flag it marks it with
 *
 * @param schema - The schema to check
 * @returns - True when the schema describes an additional property
 */
export function isAdditionalPropertySchema(schema: unknown) {
  return Boolean((schema as RJSFMarkedSchema)?.[ADDITIONAL_PROPERTY_FLAG]);
}

/** The value a container field stores for what its child at `fieldPath` sends. A cleared child sends `undefined`,
 * which would take its slot out of the data, so an array item is stored as `null`, which keeps its index and gives the
 * validator an item to check (https://github.com/tdegrunt/jsonschema/issues/206), and an `additionalProperties` entry
 * as `''`, which keeps its key and the key input with it. A field that announces a key move with its change, as an
 * option switch does, sends this value itself, so the change that reaches the form carries the value the move was
 * announced with. The overload is the one trust point that the stored value is of the type the child's `onChange`
 * hands over, as `FieldProps['onChange']` types a change at any depth
 *
 * @param value - The value the child sends
 * @param fieldPath - The `FieldPath` of the child
 * @param isAdditionalProperty - Whether the child is an `additionalProperties` entry of its object
 * @returns - The value the container stores
 */
export function storedValue<V>(value: V, fieldPath: FieldPath, isAdditionalProperty: boolean): V;
export function storedValue(value: unknown, fieldPath: FieldPath, isAdditionalProperty: boolean): unknown {
  if (value !== undefined) {
    return value;
  }
  if (fieldPathEndsWithIndex(fieldPath)) {
    return null;
  }
  return isAdditionalProperty ? '' : undefined;
}

/** `uiSchema` with the form's global UI options, for a `getDefaultFormState()` call on part of the schema, which reads
 * them off the uiSchema it is handed: a field's own entry does not carry the root's. They say where the Optional Data
 * Controls show an optional object without its fields, whose `null` fills the defaults leave out, so data a control adds
 * leaves such an object out as the data the form mounts with does
 *
 * @param uiSchema - The uiSchema of the part of the schema
 * @param globalUiOptions - The form's global UI options, from the `registry`
 * @returns - The uiSchema to compute the defaults with
 */
export function withGlobalUiOptions<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F> | undefined,
  globalUiOptions: GlobalUISchemaOptions | undefined,
): UiSchema<T, S, F> | undefined {
  if (!globalUiOptions) {
    return uiSchema;
  }
  return uiSchema
    ? { ...uiSchema, [UI_GLOBAL_OPTIONS_KEY]: globalUiOptions }
    : { [UI_GLOBAL_OPTIONS_KEY]: globalUiOptions };
}

/** Gets the heading an object or array draws itself. Under its plan: none where the plan gives its label to someone
 * else, and otherwise the plan's label, except that the key input beside an `additionalProperties` entry already shows
 * its key, which labels the entry, so the entry is headed by the `ui:title` or the schema `title` naming such entries
 * where there is one. Without a plan: its own title, unless `ui:label: false` turns it off. Its template is handed
 * exactly this as its `title`, so a template reading only `title` draws that heading and lays out what it would put
 * beside it elsewhere where it is empty
 *
 * @param presentation - The container's plan, if `SchemaField` built one
 * @param schema - The container's schema
 * @param uiOptions - The container's ui options
 * @param ownTitle - The title the container draws without a plan
 * @returns - The heading the container draws, or the empty string for none
 */
export function getContainerHeading<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(presentation: FieldPresentation | undefined, schema: S, uiOptions: UIOptionsType<T, S, F>, ownTitle: string): string {
  if (!presentation) {
    return (uiBooleanOption(uiOptions.label) ?? true) ? ownTitle : '';
  }
  if (presentation.label.by !== 'self') {
    return '';
  }
  return (isAdditionalPropertySchema(schema) && (uiOptions.title || schema.title)) || presentation.label.text;
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
  // oxlint-disable-next-line typescript/no-deprecated -- set for a template that doesn't read `presentation`
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
    return getBooleanFieldWidget<T, S, F>(getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions));
  }
  if (field === fields.ArrayField) {
    return getArrayFieldWidget<T, S, F>(schema, uiSchema, registry);
  }
  return undefined;
}

/** Gets a plan's `describedBy` without the ids of parts it leaves to the field below, and its control described by the
 * parts still left, marked invalid while its errors show, so neither names a part nothing draws here
 *
 * @param presentation - The plan
 * @param ids - The ids of the parts left to the field below
 * @returns - The plan's `describedBy` and `control`
 */
export function withoutDescribers(
  presentation: FieldPresentation,
  ids: ReadonlySet<string>,
): Pick<FieldPresentation, 'describedBy' | 'control'> {
  const { describedBy, control, errors } = presentation;
  const shownDescribers = describedBy.filter((id) => !ids.has(id));
  if (!control) {
    return { describedBy: shownDescribers, control };
  }
  const { 'aria-describedby': _describedBy, 'aria-invalid': _invalid, ...attributes } = control.attributes;
  return {
    describedBy: shownDescribers,
    control: {
      ...control,
      attributes: { ...attributes, ...getDescribedControlAttributes(shownDescribers, errors.messages) },
    },
  };
}
