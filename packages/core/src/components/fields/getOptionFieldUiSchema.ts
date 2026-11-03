import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  getRenderedOptionUiSchema,
  getSchemaType,
  getUiOptions,
  getUnionTypes,
  hasWidget,
  isConstant,
  UI_OPTIONS_KEY,
} from '@rjsf/utils';

import { getSelectSchemaInfo, withoutUiWidget } from './fieldWidgetUtils.ts';

/** Returns the field's `uiSchema` for an option that declares none of its own, without the field's title and
 * description, which the field's plan already carries to the option's, so the option keeps the title and description
 * its own schema gives it rather than taking the field's in their place. Shadowed in `ui:options` as well, as
 * `getUiOptions()` reads either spelling
 *
 * @param uiSchema - The field's uiSchema
 * @returns - The uiSchema the option renders with
 */
function withoutFieldText<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F>,
): UiSchema<T, S, F> {
  const options = uiSchema[UI_OPTIONS_KEY];
  if (
    !('ui:title' in uiSchema) &&
    !('ui:description' in uiSchema) &&
    options?.title === undefined &&
    options?.description === undefined
  ) {
    return uiSchema;
  }
  const { 'ui:title': _title, 'ui:description': _description, ...rest } = uiSchema;
  return {
    // The rest of a generic `UiSchema<T, S, F>` is a type the checker can't relate back to it
    ...(rest as UiSchema<T, S, F>),
    [UI_OPTIONS_KEY]: { ...options, title: undefined, description: undefined },
  };
}

/** Returns a `uiSchema` an option inherits from its field, without a `ui:widget` no widget implements for the option's
 * type: a widget named for one member of a union has no implementation for the others, and `getWidget()` throws rather
 * than falling back. An option with no type to tell by keeps it, for the options of its own it hands the widget on to,
 * as does one the fallback UI renders, which drops it for a type its selector is on that has no implementation of it
 *
 * @param uiSchema - The uiSchema the option inherits
 * @param option - The option as it is rendered
 * @param registry - The registry, whose `widgets` and `globalFormOptions` are read
 * @returns - The uiSchema the option renders with
 */
function withImplementedWidget<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F>,
  option: S | null,
  { widgets, globalFormOptions }: Registry<T, S, F>,
): UiSchema<T, S, F> {
  const { widget } = getUiOptions<T, S, F>(uiSchema);
  if (!widget || !option) {
    return uiSchema;
  }
  const { schema: optionSchema, isSelectSchema } = getSelectSchemaInfo<S>(option);
  const rendersInFallbackUi =
    globalFormOptions.useFallbackUiForUnsupportedType &&
    !isSelectSchema &&
    !isConstant<S>(optionSchema) &&
    getUnionTypes<S>(optionSchema) !== undefined;
  if (
    rendersInFallbackUi ||
    getSchemaType<S>(optionSchema) === undefined ||
    hasWidget<T, S, F>(optionSchema, widget, widgets)
  ) {
    return uiSchema;
  }
  return withoutUiWidget<T, S, F>(uiSchema);
}

/** Returns the uiSchema the `SchemaField` of an `anyOf`/`oneOf` option renders with, which `AnyOfField` renders it with
 * and `SchemaField` plans the field's label by: the field's own, without its title and description or a `ui:widget` the
 * option has no implementation of, for an option declaring none of its own, or else the option's, with the field's say over the extra keys the option takes
 *
 * @param schema - The schema of the field rendering the options
 * @param option - The option shown, with its own `$ref` resolved, if one is
 * @param uiSchema - The field's uiSchema
 * @param optionUiSchema - The uiSchema `selectOptionUiSchema()` picked for the option
 * @param renderedOption - The option as `getRenderedOptionSchema()` renders it
 * @param registry - The registry
 * @returns - The uiSchema the option renders with
 */
export default function getOptionFieldUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  option: S | null | undefined,
  uiSchema: UiSchema<T, S, F> | undefined,
  optionUiSchema: UiSchema<T, S, F> | undefined,
  renderedOption: S | null,
  registry: Registry<T, S, F>,
): UiSchema<T, S, F> | undefined {
  if (uiSchema && optionUiSchema === uiSchema) {
    return withImplementedWidget<T, S, F>(withoutFieldText<T, S, F>(uiSchema), renderedOption, registry);
  }
  return option ? getRenderedOptionUiSchema<T, S, F>(schema, option, uiSchema, optionUiSchema) : optionUiSchema;
}
