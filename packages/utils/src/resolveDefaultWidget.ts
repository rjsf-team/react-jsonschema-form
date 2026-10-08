import getSchemaType from './getSchemaType.ts';
import { getWidgetType } from './getWidget.tsx';
import hasWidget from './hasWidget.ts';
import optionsList from './optionsList.ts';
import type {
  EnumOptionsType,
  FormContextType,
  RegistryWidgetsType,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from './types.ts';

/** Computes the widget name a field falls back to when no `ui:widget` is specified, along with the `enumOptions`
 * (if any) that back a `select`-like fallback. The default is `select` when `schema` has enumerable options,
 * the schema's `format` when a widget is registered for it under that name or as an alias of the type the schema
 * resolves to, or `text` otherwise.
 *
 * @param schema - The schema for the field
 * @param uiSchema - The uiSchema for the field
 * @param schemaUtils - The `SchemaUtilsType` used to detect whether `schema` has enumerable options
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - The default widget name and the `enumOptions`, if any, computed along the way
 */
export default function resolveDefaultWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
  registeredWidgets: RegistryWidgetsType<T, S, F> = {},
): { defaultWidget: string; enumOptions: EnumOptionsType<S>[] | undefined } {
  const { format } = schema;
  const enumOptions = schemaUtils.isSelect(schema) ? optionsList<T, S, F>(schema, uiSchema) : undefined;
  let defaultWidget = enumOptions ? 'select' : 'text';
  // A `format` constrains only the string member of a `type` list, so unlike a `ui:widget` it takes no widget of
  // another type the list names: an `email` on a `['number', 'string']` keeps the number field's text input. A widget
  // registered under the format's own name is the caller's choice, and is used whatever the type
  if (
    format &&
    hasWidget<T, S, F>(schema, format, registeredWidgets) &&
    (Object.hasOwn(registeredWidgets, format) || getWidgetType<S>(schema, format) === getSchemaType<S>(schema))
  ) {
    defaultWidget = format;
  }
  return { defaultWidget, enumOptions };
}
