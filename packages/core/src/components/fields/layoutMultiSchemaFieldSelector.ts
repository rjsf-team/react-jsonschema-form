import type {
  EnumOptionsType,
  FormContextType,
  Registry,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
  UIOptionsType,
  Widget,
} from '@rjsf/utils';
import {
  CONST_KEY,
  DEFAULT_KEY,
  getByPath,
  getDiscriminatorFieldFromSchema,
  getOptionSelectorSchema,
  getPropertySchema,
  getSchemaType,
  getUiOptions,
  getXxxOfKey,
  optionsList,
  PROPERTIES_KEY,
  resolveWidget,
} from '@rjsf/utils';

/** Gets the index of the selected option in the list of `options`, the way `getSelectedOption()` finds the option
 *
 * @param options - The list of schemas each representing a choice in the `oneOf`
 * @param selectorField - The name of the field that is common in all of the schemas that represents the selector field
 * @param value - The current value of the selector field from the data
 * @returns - The index of the selected option, or -1 when none matches
 */
export function getSelectedOptionIndex<S extends StrictRJSFSchema = RJSFSchema>(
  options: EnumOptionsType<S>[],
  selectorField: string,
  value: unknown,
): number {
  const defaultValue = '!@#!@$@#$!@$#';
  return options.findIndex(({ schema: option }) => {
    const selector = option![PROPERTIES_KEY]?.[selectorField];
    const result = getByPath(selector, DEFAULT_KEY, getByPath(selector, CONST_KEY, defaultValue));
    return result === value;
  });
}

/** Gets the selected option from the list of `options`, using the `selectorField` to search inside each `option` for
 * the `properties[selectorField].default(or const)` that matches the given `value`.
 *
 * @param options - The list of schemas each representing a choice in the `oneOf`
 * @param selectorField - The name of the field that is common in all of the schemas that represents the selector field
 * @param value - The current value of the selector field from the data
 */
export function getSelectedOption<S extends StrictRJSFSchema = RJSFSchema>(
  options: EnumOptionsType<S>[],
  selectorField: string,
  value: unknown,
): S | undefined {
  return options[getSelectedOptionIndex<S>(options, selectorField, value)]?.schema;
}

/** Computes the `enumOptions` array from the schema and options.
 *
 * @param schema - The schema that contains the `options`
 * @param options - The options from the `schema`
 * @param schemaUtils - The SchemaUtilsType object used to call retrieveSchema,
 * @param [uiSchema] - The optional uiSchema for the schema
 * @param [formData] - The optional formData associated with the schema
 * @returns - The list of enumOptions for the `schema` and `options`
 * @throws - Error when no enum options were computed
 */
export function computeEnumOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  options: S[],
  schemaUtils: SchemaUtilsType<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  formData?: T,
): EnumOptionsType<S>[] {
  let selectorField = getDiscriminatorFieldFromSchema<S>(schema);
  if (uiSchema) {
    const { optionsSchemaSelector = selectorField } = getUiOptions<T, S, F>(uiSchema);
    selectorField = optionsSchemaSelector;
  }
  const realOptions = options.map((opt: S) => {
    const option = schemaUtils.retrieveSchema(opt, formData);
    if (!selectorField) {
      return option;
    }
    const written = option[PROPERTIES_KEY]?.[selectorField];
    const selector = getOptionSelectorSchema<S>(option, selectorField, (ref) =>
      schemaUtils.retrieveSchema(ref, getByPath(formData, selectorField)),
    );
    // The option keeps the identity `retrieveSchema()` gives it where its selector is read as written
    return selector === undefined || selector === written
      ? option
      : { ...option, [PROPERTIES_KEY]: { ...option[PROPERTIES_KEY], [selectorField]: selector } };
  });
  let tempSchema = schema;
  const xxxOfKey = getXxxOfKey<S>(schema);
  if (xxxOfKey) {
    tempSchema = { ...schema, [xxxOfKey]: realOptions };
  }
  const enumOptions = optionsList<T, S, F>(tempSchema, uiSchema);
  if (!enumOptions) {
    throw new Error(`No enumOptions were computed from the schema ${JSON.stringify(tempSchema)}`);
  }
  return enumOptions;
}

/** Gets the name of the property that selects the option: `ui:optionsSchemaSelector`, or else the discriminator
 *
 * @param schema - The schema of the field
 * @param uiOptions - The field's ui options
 * @returns - The name of the selector property, if there is one
 */
export function getSelectorField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiOptions: UIOptionsType<T, S, F>): string | undefined {
  return uiOptions.optionsSchemaSelector ?? getDiscriminatorFieldFromSchema<S>(schema);
}

/** Gets the first of the schema's options, retrieved without the data, which the selector's widget is resolved against
 * by both `SchemaField`'s plan and `LayoutMultiSchemaField`, so the two can't resolve different widgets
 *
 * @param schema - The schema of the field
 * @param schemaUtils - The SchemaUtilsType object used to call retrieveSchema
 * @returns - The first option, retrieved, if the schema has one
 */
export function getFirstOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, schemaUtils: SchemaUtilsType<T, S, F>): S | undefined {
  const xxxOfKey = getXxxOfKey<S>(schema);
  const [firstOption] = ((xxxOfKey && schema[xxxOfKey]) ?? []) as S[];
  return firstOption && schemaUtils.retrieveSchema(firstOption);
}

/** Gets the widget `LayoutMultiSchemaField` renders its option selector with, which `SchemaField` plans the field with
 * too: its `ui:widget`, or radios for a schema with a discriminator and a select for one without, resolved against the
 * selector property's schema in the first option. A selector property with no type of its own, nor one its `const` or
 * `enum` implies, takes the option's, declared or implied, so the widget never depends on the data and the plan needn't
 * read it
 *
 * @param schema - The schema of the field
 * @param firstOption - The first of the schema's options, from `getFirstOption()`
 * @param selectorField - The name of the selector property
 * @param uiOptions - The field's ui options, read with the registry's `globalUiOptions`, which never hold a `widget` or
 *   an `optionsSchemaSelector`, so only the field's own picks the widget
 * @param widgets - The registry's widgets
 * @returns - The widget, as `resolveWidget()` returns it
 */
export function resolveSelectorWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  firstOption: S | undefined,
  selectorField: string,
  uiOptions: UIOptionsType<T, S, F>,
  widgets: Registry<T, S, F>['widgets'],
): { Widget: Widget<T, S, F> } {
  // Named as registered rather than by alias, which `getWidget()` maps only through a type, so a union with no options
  // to type the selector by still renders the default
  const widget = uiOptions.widget ?? (getDiscriminatorFieldFromSchema<S>(schema) ? 'RadioWidget' : 'SelectWidget');
  const propertySchema = getPropertySchema<S>(firstOption, selectorField);
  const selectorSchema = getSchemaType<S>(propertySchema)
    ? propertySchema
    : { ...propertySchema, type: firstOption?.type ?? (firstOption && getSchemaType<S>(firstOption)) };
  return resolveWidget<T, S, F>(selectorSchema, widget, widgets);
}
