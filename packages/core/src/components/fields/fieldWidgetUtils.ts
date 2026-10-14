import type {
  EnumOptionsType,
  Field,
  FormContextType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Widget,
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
