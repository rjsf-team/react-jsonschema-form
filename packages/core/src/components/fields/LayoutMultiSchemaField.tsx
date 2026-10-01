import { useMemo } from 'react';
import type {
  EnumOptionsType,
  ErrorSchema,
  FieldProps,
  FormContextType,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  CONST_KEY,
  DEFAULT_KEY,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getOptionUiSchema,
  hashObject,
  fieldPathToName,
  ONE_OF_KEY,
  optionsList,
  PROPERTIES_KEY,
  descriptionId,
  getTemplate,
  getFieldClassNames,
  getPropertySchema,
  getUiOptions,
  getXxxOfKey,
  getVisibleErrors,
  getWidget,
  noop,
  omitConsumedStyling,
} from '@rjsf/utils';

import formDataForNewOption from './formDataForNewOption.ts';

/** Gets the index of the selected option in the list of `options`, the way `getSelectedOption()` finds the option
 *
 * @param options - The list of schemas each representing a choice in the `oneOf`
 * @param selectorField - The name of the field that is common in all of the schemas that represents the selector field
 * @param value - The current value of the selector field from the data
 * @returns - The index of the selected option, or -1 when none matches
 */
function getSelectedOptionIndex<S extends StrictRJSFSchema = RJSFSchema>(
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
  const realOptions = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
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

/** The `LayoutMultiSchemaField` is an adaptation of the `MultiSchemaField` but changed considerably to only
 * support `anyOf`/`oneOf` fields that are being displayed in a `LayoutGridField` where the field selection is shown as
 * a radio group by default. It expects that a `selectorField` is provided (either directly via the `discriminator`
 * field or indirectly via `ui:optionsSchemaSelector` in the `uiSchema`) to help determine which `anyOf`/`oneOf` schema
 * is active. If no `selectorField` is specified, then an error is thrown.
 */
export default function LayoutMultiSchemaField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    name,
    baseType,
    disabled = false,
    formData,
    fieldPath,
    id,
    onBlur,
    onChange,
    options,
    onFocus,
    registry,
    uiSchema,
    schema,
    autofocus,
    readonly,
    required,
    errorSchema,
    hideError = false,
  } = props;
  const { widgets, schemaUtils, globalUiOptions, uiSchemaDefinitions } = registry;
  const discriminator = getDiscriminatorFieldFromSchema(schema);
  const schemaHash = hashObject(schema);
  const optionsHash = hashObject(options);
  const uiSchemaHash = uiSchema ? hashObject(uiSchema) : '';
  const formDataHash = formData ? hashObject(formData) : '';

  // Derived rather than held in state: `computeEnumOptions()` retrieves every option's schema, which a `useState`
  // initializer re-runs and throws away on every render, and the effect that re-synced the state rendered the stale
  // options once before replacing them
  const enumOptions = useMemo(
    () => computeEnumOptions(schema, options, schemaUtils, uiSchema, formData),
    // We are using hashes in place of the dependencies
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [schemaHash, optionsHash, schemaUtils, uiSchemaHash, formDataHash],
  );
  const {
    widget = discriminator ? 'radio' : 'select',
    title = '',
    placeholder = '',
    optionsSchemaSelector: selectorField = discriminator,
    hideError: uiSchemaHideError,
    // See #439: the class names and style this field's `FieldTemplate` consumes must not reach the widget below, so
    // they are destructured out of the options it is handed and stripped from the `uiSchema` it is handed as well
    classNames: uiClassNames,
    style,
    ...uiOptions
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  // Memoized so a selector widget deriving anything from its `uiSchema` isn't invalidated by a new object each render.
  // A `memo` boundary around it is not what this buys: `widgetOptions` below is rebuilt on every render regardless
  const widgetUiSchema = useMemo(() => omitConsumedStyling<T, S, F>(uiSchema), [uiSchema]);
  // These must be resolved from the UI options, not from `options` (the anyOf/oneOf option schemas), or a
  // `ui:FieldTemplate`/`ui:FieldErrorTemplate` override on this field is silently ignored
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  const FieldErrorTemplate = getTemplate<'FieldErrorTemplate', T, S, F>('FieldErrorTemplate', registry, uiOptions);
  const FieldHelpTemplate = getTemplate<'FieldHelpTemplate', T, S, F>('FieldHelpTemplate', registry, uiOptions);
  const FieldTemplate = getTemplate<'FieldTemplate', T, S, F>('FieldTemplate', registry, uiOptions);
  if (!selectorField) {
    throw new Error('No selector field provided for the LayoutMultiSchemaField');
  }
  const selectedOption = getByPath(formData, selectorField);
  let optionSchema = getPropertySchema<S>(enumOptions[0]?.schema, selectorField);
  const option = getSelectedOption<S>(enumOptions, selectorField, selectedOption);
  // If the subschema doesn't declare a type, infer the type from the parent schema
  optionSchema = optionSchema?.type ? optionSchema : { ...optionSchema, type: option?.type || baseType };
  const Widget = getWidget<T, S, F>(optionSchema, widget, widgets);

  // The following code was copied from `@rjsf`'s `SchemaField`
  // Set hideError to the value provided in the uiSchema, otherwise stick with the prop to propagate to children
  const hideFieldError = uiSchemaHideError === undefined ? hideError : Boolean(uiSchemaHideError);

  const rawErrors = errorSchema?.[ERRORS_KEY] ?? [];
  const fieldErrorSchema = { ...errorSchema } as ErrorSchema<T>;
  delete fieldErrorSchema[ERRORS_KEY];
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

  /** Callback function that updates the selected option and adjusts the form data based on the structure of the new
   * option, calling the `onChange` callback with the adjusted formData.
   *
   * @param opt - If the option is undefined, we are going to clear the selection otherwise we
   *      will use it as the index of the new option to select
   */
  const onOptionChange = (opt?: unknown) => {
    if (disabled || readonly) {
      return;
    }
    const newOptionIndex = getSelectedOptionIndex<S>(enumOptions, selectorField, opt);
    const oldOptionIndex = getSelectedOptionIndex<S>(enumOptions, selectorField, selectedOption);
    const newOption = enumOptions[newOptionIndex]?.schema;
    const oldOption = enumOptions[oldOptionIndex]?.schema;

    // The newly-selected option's own uiSchema is resolved the same way AnyOfField's optionsUiSchema/optionUiSchema
    // does — `uiSchema.oneOf[i]`/`uiSchema.anyOf[i]` when declared as an array reaching that option's index, falling
    // back to this field's own uiSchema otherwise — so per-option ui:initialValue/ui:emptyValue overrides apply the
    // same way here as they do when the same schema is rendered through plain SchemaField/AnyOfField.
    // `uiSchemaDefinitions` comes from the registry: `uiSchema` here is only this field's own sub-uiSchema and
    // never carries the root's `ui:definitions` itself.
    const keyword = getXxxOfKey<S>(schema) ?? ONE_OF_KEY;
    const newFormData = formDataForNewOption<T, S, F>(schemaUtils, formData, newOption, oldOption, schema, {
      newOptionUiSchema: getOptionUiSchema<T, S, F>(uiSchema, keyword, newOptionIndex),
      oldOptionUiSchema: getOptionUiSchema<T, S, F>(uiSchema, keyword, oldOptionIndex),
      uiSchemaDefinitions,
    });
    if (newFormData) {
      setByPath(newFormData, selectorField, opt);
    }
    // Pass the component name in the path
    onChange(newFormData, fieldPath, undefined, id);
  };

  // filtering the options based on the type of widget because `selectField` does not recognize the `convertOther` prop
  const widgetOptions = { enumOptions, ...uiOptions };
  const visibleErrors = getVisibleErrors({ rawErrors, hideError: hideFieldError });
  const hasErrors = visibleErrors.length > 0;
  const errors = hasErrors ? (
    <FieldErrorTemplate id={id} schema={schema} errors={visibleErrors} registry={registry} />
  ) : undefined;
  const { help, description: uiDescription } = uiOptions;
  const description = uiDescription || schema.description || '';
  const descriptionComponent = (
    <DescriptionFieldTemplate
      id={descriptionId(id)}
      description={description}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
  const helpComponent = (
    <FieldHelpTemplate
      help={help}
      id={id}
      schema={schema}
      uiSchema={uiSchema}
      hasErrors={hasErrors}
      registry={registry}
    />
  );

  return (
    <FieldTemplate
      fieldPath={fieldPath}
      id={id}
      schema={schema}
      label={(title || schema.title) ?? ''}
      keyName={name}
      disabled={disabled || (Array.isArray(enumOptions) && enumOptions.length === 0)}
      uiSchema={uiSchema}
      required={required}
      readonly={!!readonly}
      registry={registry}
      displayLabel={displayLabel}
      classNames={getFieldClassNames<S>(schema, hasErrors, uiClassNames)}
      style={style}
      // `widget` carries the resolved value, so a `ui:widget` of `hidden` is what this matches, not its default
      hidden={widget === 'hidden'}
      formData={formData}
      description={descriptionComponent}
      rawDescription={description}
      errors={errors}
      help={helpComponent}
      rawHelp={help}
      rawErrors={hideFieldError ? undefined : rawErrors}
      errorSchema={errorSchema}
      hideError={hideFieldError}
      onChange={onChange}
      onKeyRename={noop}
      onKeyRenameBlur={noop}
      onRemoveProperty={noop}
    >
      <Widget
        id={id}
        name={name}
        schema={schema}
        label={(title || schema.title) ?? ''}
        disabled={disabled || (Array.isArray(enumOptions) && enumOptions.length === 0)}
        uiSchema={widgetUiSchema}
        autofocus={autofocus}
        readonly={readonly}
        required={required}
        registry={registry}
        multiple={false}
        rawErrors={rawErrors}
        hideError={hideFieldError}
        hideLabel={!displayLabel}
        errorSchema={fieldErrorSchema}
        placeholder={placeholder}
        onChange={onOptionChange}
        onBlur={onBlur}
        onFocus={onFocus}
        value={selectedOption}
        options={widgetOptions}
        htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
      />
    </FieldTemplate>
  );
}
