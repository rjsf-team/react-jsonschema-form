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
 * the schema's `format` when a widget is registered for it, or `text` otherwise.
 *
 * @param schema - The schema for the field
 * @param uiSchema - The uiSchema for the field
 * @param schemaUtils - The `SchemaUtilsType` used to detect whether `schema` has enumerable options
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - The default widget name and the `enumOptions`, if any, computed along the way
 */
export default function resolveDefaultWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
  registeredWidgets: RegistryWidgetsType<T, S, F> = {},
): { defaultWidget: string; enumOptions: EnumOptionsType<S>[] | undefined } {
  const { format } = schema;
  const enumOptions = schemaUtils.isSelect(schema) ? optionsList<T, S, F>(schema, uiSchema) : undefined;
  let defaultWidget = enumOptions ? 'select' : 'text';
  if (format && hasWidget<T, S, F>(schema, format, registeredWidgets)) {
    defaultWidget = format;
  }
  return { defaultWidget, enumOptions };
}
