import { useMemo } from 'react';
import type {
  EnumOptionsType,
  ErrorSchema,
  FieldPresentation,
  FieldPresentationInputs,
  FieldProps,
  FormContextType,
  Registry,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
  Widget,
} from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  CONST_KEY,
  DEFAULT_KEY,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getOptionSelectorSchema,
  getOptionUiSchema,
  fieldPathToName,
  ONE_OF_KEY,
  optionsList,
  PROPERTIES_KEY,
  getDeprecatedHandling,
  getPresentationDeclaration,
  getTemplates,
  getFieldClassNames,
  getPropertySchema,
  getUiOptions,
  getXxxOfKey,
  noop,
  omitConsumedStyling,
  TranslatableString,
  resolveFieldPresentation,
  resolveWidget,
  uiBooleanOption,
} from '@rjsf/utils';

import useSendOptionSwitch from '../../hooks/useSendOptionSwitch.ts';
import {
  getDeprecatedTemplateProps,
  getTemplateParts,
  getWidgetErrorProps,
  getWidgetLabelProps,
} from './fieldWidgetUtils.ts';
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

/** Gets the schema of the selector property, taking `inferredType` when it declares no type of its own, memoised since
 * the plan is memoised on it and a typeless selector would otherwise hand it a new schema every render. Keyed on the
 * property's own schema rather than on `enumOptions`, which is rebuilt with every change of the data
 *
 * @param enumOptions - The options, whose first holds the selector property
 * @param selectorField - The name of the selector property
 * @param inferredType - The type of the selected option, or the field's base type
 * @returns - The selector's schema
 */
function useSelectorSchema<S extends StrictRJSFSchema>(
  enumOptions: EnumOptionsType<S>[],
  selectorField: string,
  inferredType: S['type'] | string | undefined,
): S {
  const propertySchema = getPropertySchema<S>(enumOptions[0]?.schema, selectorField);
  return useMemo(
    () => (propertySchema.type ? propertySchema : { ...propertySchema, type: inferredType }),
    [propertySchema, inferredType],
  );
}

/** Builds the plan of a `LayoutMultiSchemaField`, which no `SchemaField` renders, with the resolvers `SchemaField` plans a
 * field rendering its selector widget with, memoised on what it reads, as `SchemaField` memoises its plans (#5490
 * decision 19)
 *
 * @param inputs - The field's id, registry, the schema its selector renders and its widget, and its own label,
 *   description, help, errors and whether it renders a control
 * @returns - The plan
 */
function useLayoutPresentation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  inputs: Omit<FieldPresentationInputs, 'declaration' | 'componentId' | 'inherited'> & {
    registry: Registry<T, S, F>;
    schema: S;
    widget: Widget<T, S, F> | string | undefined;
  },
): FieldPresentation {
  const { id, registry, schema, widget, label, showLabel, description, help, errors, hideError, hasControl, required } =
    inputs;
  return useMemo(
    () =>
      resolveFieldPresentation({
        id,
        declaration: getPresentationDeclaration<T, S, F>(registry, {
          schema,
          field: registry.fields.LayoutMultiSchemaField,
          fieldKey: 'LayoutMultiSchemaField',
          widget,
        }),
        label,
        showLabel,
        description,
        help,
        errors,
        hideError,
        hasControl,
        required,
      }),
    [id, registry, schema, widget, label, showLabel, description, help, errors, hideError, hasControl, required],
  );
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
    hideError,
  } = props;
  const { widgets, schemaUtils, globalUiOptions, uiSchemaDefinitions } = registry;
  const sendOptionSwitch = useSendOptionSwitch(fieldPath);
  const discriminator = getDiscriminatorFieldFromSchema(schema);
  const enumOptions = useMemo(
    () => computeEnumOptions(schema, options, schemaUtils, uiSchema, formData),
    [schema, options, schemaUtils, uiSchema, formData],
  );
  const {
    widget = discriminator ? 'radio' : 'select',
    title = '',
    placeholder = '',
    optionsSchemaSelector: selectorField = discriminator,
    hideError: ownHideError,
    // See #439: the class names and style this field's `FieldTemplate` consumes must not reach the widget below, so
    // they are destructured out of the options it is handed and stripped from the `uiSchema` it is handed as well
    classNames: uiClassNames,
    style,
    ...uiOptions
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  // Memoized so a selector widget deriving anything from its `uiSchema` isn't invalidated by a new object each render.
  // A `memo` boundary around it is not what this buys: `widgetOptions` below is rebuilt on every render regardless
  const widgetUiSchema = useMemo(() => omitConsumedStyling<T, S, F>(uiSchema), [uiSchema]);
  const deprecatedHandling = getDeprecatedHandling<T, S, F>(schema, uiOptions);
  // `ui:disabled` and the deprecation modes are resolved from the UI options the way `SchemaField` resolves them, so
  // a discriminated cell behaves like the same schema rendered outside a layout grid. A selector with nothing to
  // select from is this field's own reason to be disabled, which no other field has
  const isDisabled =
    uiBooleanOption(uiOptions.disabled ?? disabled) || deprecatedHandling === 'disable' || enumOptions.length === 0;
  const ownLabel = (title || schema.title) ?? '';
  // A label that is empty is left empty, which is the one place this deliberately parts from `getFieldLabel()`: that
  // falls back to the property name, while a discriminated cell has no such fallback and a typeless one -- the usual
  // shape -- is commonly titleless, so decorating it would render a `<label>` naming nothing as the norm
  const label =
    deprecatedHandling === 'label' && ownLabel
      ? registry.translateString(TranslatableString.DeprecatedLabel, [ownLabel])
      : ownLabel;
  // These must be resolved from the UI options, not from `options` (the anyOf/oneOf option schemas), or a
  // `ui:FieldTemplate`/`ui:FieldErrorTemplate` override on this field is silently ignored
  const { DescriptionFieldTemplate, FieldErrorTemplate, FieldHelpTemplate, FieldTemplate } = getTemplates<T, S, F>(
    registry,
    uiOptions,
  );
  if (!selectorField) {
    throw new Error('No selector field provided for the LayoutMultiSchemaField');
  }
  const selectedOption = getByPath(formData, selectorField);
  const option = getSelectedOption<S>(enumOptions, selectorField, selectedOption);
  const optionSchema = useSelectorSchema<S>(enumOptions, selectorField, option?.type || baseType);
  const { Widget } = resolveWidget<T, S, F>(optionSchema, widget, widgets);

  // Resolved as `SchemaField` resolves it: the field's own `ui:hideError`, then the one handed down
  const hideFieldError = uiBooleanOption(ownHideError) ?? hideError;

  const ownErrors = errorSchema?.[ERRORS_KEY];
  const rawErrors = ownErrors ?? [];
  const fieldErrorSchema = { ...errorSchema } as ErrorSchema<T>;
  delete fieldErrorSchema[ERRORS_KEY];

  /** Callback function that updates the selected option and adjusts the form data based on the structure of the new
   * option, calling the `onChange` callback with the adjusted formData.
   *
   * @param opt - If the option is undefined, we are going to clear the selection otherwise we
   *      will use it as the index of the new option to select
   */
  const onOptionChange = (opt?: unknown) => {
    // `isDisabled`, not the `disabled` prop: a `ui:disabled` of `false` re-enables the selector inside a disabled
    // form, and the prop alone would render a clickable control whose every selection is dropped here
    if (isDisabled || readonly) {
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
    const newOptionUiSchema = getOptionUiSchema<T, S, F>(uiSchema, keyword, newOptionIndex);
    const oldOptionUiSchema = getOptionUiSchema<T, S, F>(uiSchema, keyword, oldOptionIndex);
    const newFormData = formDataForNewOption<T, S, F>(schemaUtils, formData, newOption, oldOption, schema, {
      newOptionUiSchema,
      oldOptionUiSchema,
      uiSchemaDefinitions,
      globalUiOptions,
    });
    if (newFormData) {
      setByPath(newFormData, selectorField, opt);
    }
    // Pass the component name in the path
    sendOptionSwitch(
      schema,
      { oldOption, newOption, oldUiSchema: oldOptionUiSchema, newUiSchema: newOptionUiSchema },
      formData,
      newFormData,
      (sent) => onChange(sent, fieldPath, undefined, id),
    );
  };

  // filtering the options based on the type of widget because `selectField` does not recognize the `convertOther` prop
  const widgetOptions = { enumOptions, ...uiOptions };
  const { help: ownHelp, description: uiDescription } = uiOptions;
  const hidden = widget === 'hidden' || deprecatedHandling === 'hide';
  const showLabel = uiBooleanOption(uiOptions.label) ?? true;
  const fieldDescription = uiDescription || schema.description || '';
  // Not rendered by a `SchemaField`, so it plans itself with the same resolvers, as a field rendering its selector
  // widget, with no field above it rendering the same id
  const presentation = useLayoutPresentation<T, S, F>({
    id,
    registry,
    schema: optionSchema,
    widget,
    label,
    showLabel,
    description: fieldDescription,
    help: ownHelp,
    errors: ownErrors,
    hideError: hideFieldError,
    hasControl: !hidden,
    required,
  });
  const hasErrors = presentation.errors.messages.length > 0;
  const { description: templateDescription, help, errors: templateErrors } = getTemplateParts(presentation);
  const description = templateDescription?.text ?? '';
  const errors = templateErrors && (
    <FieldErrorTemplate id={id} schema={schema} errors={[...templateErrors]} registry={registry} />
  );
  const descriptionComponent = templateDescription?.text ? (
    <DescriptionFieldTemplate
      id={templateDescription.id}
      description={templateDescription.text}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  ) : undefined;
  const helpComponent = (
    <FieldHelpTemplate
      help={help}
      id={id}
      schema={schema}
      uiSchema={uiSchema}
      hasErrors={hasErrors}
      registry={registry}
      presentation={presentation}
    />
  );

  return (
    <FieldTemplate
      fieldPath={fieldPath}
      id={id}
      schema={schema}
      label={label}
      keyName={name}
      disabled={isDisabled}
      uiSchema={uiSchema}
      required={required}
      readonly={!!readonly}
      registry={registry}
      presentation={presentation}
      classNames={getFieldClassNames<S>(schema, hasErrors, uiClassNames)}
      style={style}
      // `widget` carries the resolved value, so a `ui:widget` of `hidden` is what this matches, not its default
      hidden={hidden}
      formData={formData}
      description={descriptionComponent}
      rawDescription={description}
      errors={errors}
      help={helpComponent}
      rawHelp={help}
      {...getDeprecatedTemplateProps<T, S, F>(presentation, rawErrors, hideFieldError)}
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
        disabled={isDisabled}
        uiSchema={widgetUiSchema}
        autofocus={autofocus}
        readonly={readonly}
        required={required}
        registry={registry}
        multiple={false}
        {...getWidgetErrorProps<T, S, F>(rawErrors)}
        hideError={hideFieldError}
        {...getWidgetLabelProps<T, S, F>(presentation, presentation.label.text, () => true)}
        presentation={presentation}
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
