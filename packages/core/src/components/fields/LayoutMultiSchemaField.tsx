import { useState, useEffect } from 'react';
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
  ANY_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  hashObject,
  fieldPathToName,
  ONE_OF_KEY,
  optionsList,
  PROPERTIES_KEY,
  getTemplate,
  getPropertySchema,
  getUiOptions,
  getWidget,
  noop,
} from '@rjsf/utils';

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
  const defaultValue = '!@#!@$@#$!@$#';
  const schemaOptions: S[] = options.map(({ schema }) => schema!);
  return schemaOptions.find((option) => {
    const selector = option[PROPERTIES_KEY]?.[selectorField];
    const result = getByPath(selector, DEFAULT_KEY, getByPath(selector, CONST_KEY, defaultValue));
    return result === value;
  });
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
export function computeEnumOptions<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  schema: S,
  options: S[],
  schemaUtils: SchemaUtilsType<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  formData?: T,
): EnumOptionsType<S>[] {
  const realOptions = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
  let tempSchema = schema;
  if (ONE_OF_KEY in schema) {
    tempSchema = { ...schema, [ONE_OF_KEY]: realOptions };
  } else if (ANY_OF_KEY in schema) {
    tempSchema = { ...schema, [ANY_OF_KEY]: realOptions };
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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const [enumOptions, setEnumOptions] = useState(computeEnumOptions(schema, options, schemaUtils, uiSchema, formData));
  const discriminator = getDiscriminatorFieldFromSchema(schema);
  const FieldErrorTemplate = getTemplate<'FieldErrorTemplate', T, S, F>('FieldErrorTemplate', registry, options);
  const FieldTemplate = getTemplate<'FieldTemplate', T, S, F>('FieldTemplate', registry, options);
  const schemaHash = hashObject(schema);
  const optionsHash = hashObject(options);
  const uiSchemaHash = uiSchema ? hashObject(uiSchema) : '';
  const formDataHash = formData ? hashObject(formData) : '';

  useEffect(() => {
    setEnumOptions(computeEnumOptions(schema, options, schemaUtils, uiSchema, formData));
    // We are using hashes in place of the dependencies
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaHash, optionsHash, schemaUtils, uiSchemaHash, formDataHash]);
  const {
    widget = discriminator ? 'radio' : 'select',
    title = '',
    placeholder = '',
    optionsSchemaSelector: selectorField = discriminator,
    hideError: uiSchemaHideError,
    ...uiOptions
  } = getUiOptions<T, S, F>(uiSchema);
  if (!selectorField) {
    throw new Error('No selector field provided for the LayoutMultiSchemaField');
  }
  const selectedOption = getByPath(formData, selectorField);
  let optionSchema = getPropertySchema<S>(enumOptions[0]?.schema, selectorField);
  const option = getSelectedOption<S>(enumOptions, selectorField, selectedOption);
  // If the subschema doesn't declare a type, infer the type from the parent schema
  optionSchema = optionSchema?.type ? optionSchema : ({ ...optionSchema, type: option?.type || baseType } as S);
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
    const newOption = getSelectedOption<S>(enumOptions, selectorField, opt);
    const oldOption = getSelectedOption<S>(enumOptions, selectorField, selectedOption);

    let newFormData = schemaUtils.sanitizeDataForNewSchema(newOption, oldOption, formData);
    if (newFormData && newOption) {
      // Call getDefaultFormState to make sure defaults are populated on change.
      newFormData = schemaUtils.getDefaultFormState(newOption, newFormData, 'excludeObjectChildren') as T;
    }
    if (newFormData) {
      setByPath(newFormData, selectorField, opt);
    }
    // Pass the component name in the path
    onChange(newFormData, fieldPath, undefined, id);
  };

  // filtering the options based on the type of widget because `selectField` does not recognize the `convertOther` prop
  const widgetOptions = { enumOptions, ...uiOptions };
  const errors =
    !hideFieldError && rawErrors.length > 0 ? (
      <FieldErrorTemplate id={id} schema={schema} errors={rawErrors} registry={registry} />
    ) : undefined;

  return (
    <FieldTemplate
      fieldPath={fieldPath}
      id={id}
      schema={schema}
      label={(title || schema.title) ?? ''}
      disabled={disabled || (Array.isArray(enumOptions) && enumOptions.length === 0)}
      uiSchema={uiSchema}
      required={required}
      readonly={!!readonly}
      registry={registry}
      displayLabel={displayLabel}
      errors={errors}
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
        uiSchema={uiSchema}
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
