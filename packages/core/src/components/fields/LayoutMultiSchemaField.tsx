import { useMemo } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  getOptionUiSchema,
  fieldPathToName,
  isObject,
  ONE_OF_KEY,
  getUiOptions,
  getXxxOfKey,
  UI_FIELD_KEY,
  UI_OPTIONS_KEY,
} from '@rjsf/utils';

import useSendOptionSwitch from '../../hooks/useSendOptionSwitch.ts';
import { getWidgetErrorProps, getWidgetLabelProps } from './fieldWidgetUtils.ts';
import formDataForNewOption from './formDataForNewOption.ts';
import {
  computeEnumOptions,
  getFirstOption,
  getSelectedOptionIndex,
  getSelectorField,
  resolveSelectorWidget,
} from './layoutMultiSchemaFieldSelector.ts';

/** Returns the field's `uiSchema` without the `field` and `fieldReplacesAnyOrOneOf` that had `SchemaField` render this
 * field in place of the options, in either spelling. A layout grid writes them into a cell's `uiSchema` itself, and
 * they mean nothing to the selector widget or to the option a switch selects, whose uiSchema falls back to this one
 *
 * @param uiSchema - The uiSchema of the field
 * @returns - The uiSchema without the directives that named this field
 */
function omitFieldDirectives<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F> | undefined,
): UiSchema<T, S, F> | undefined {
  if (!uiSchema) {
    return uiSchema;
  }
  const uiOptions = uiSchema[UI_OPTIONS_KEY];
  const strippedUiSchema: UiSchema<T, S, F> = { ...uiSchema };
  delete strippedUiSchema[UI_FIELD_KEY];
  delete strippedUiSchema['ui:fieldReplacesAnyOrOneOf'];
  if (isObject(uiOptions)) {
    const { field: _field, fieldReplacesAnyOrOneOf: _fieldReplacesAnyOrOneOf, ...selectorUiOptions } = uiOptions;
    strippedUiSchema[UI_OPTIONS_KEY] = selectorUiOptions;
  }
  return strippedUiSchema;
}

/** The `LayoutMultiSchemaField` is an adaptation of the `MultiSchemaField` but changed considerably to only
 * support `anyOf`/`oneOf` fields that are being displayed in a `LayoutGridField` where the field selection is shown as
 * a radio group by default. It expects that a `selectorField` is provided (either directly via the `discriminator`
 * field or indirectly via `ui:optionsSchemaSelector` in the `uiSchema`) to help determine which `anyOf`/`oneOf` schema
 * is active. If no `selectorField` is specified, then an error is thrown.
 *
 * It renders the selector widget alone: `SchemaField` renders it in place of the options, within the `FieldTemplate`
 * it renders for every field, and resolves its label, `ui:disabled`, `ui:readonly`, `ui:required`, `ui:hideError` and
 * deprecation handling, as for any other field, disabling it too when there are no options to select
 */
export default function LayoutMultiSchemaField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    name,
    disabled = false,
    formData,
    fieldPath,
    id,
    onBlur,
    onChange,
    onFocus,
    registry,
    uiSchema: namingUiSchema,
    schema,
    autofocus,
    readonly,
    required,
    errorSchema,
    hideError,
    // oxlint-disable-next-line typescript/no-deprecated -- handed on to its widget, for one that doesn't read `presentation`
    rawErrors,
    presentation,
    title: parentTitle,
  } = props;
  const { widgets, schemaUtils, globalUiOptions, uiSchemaDefinitions } = registry;
  const sendOptionSwitch = useSendOptionSwitch(fieldPath);
  const uiSchema = useMemo(() => omitFieldDirectives<T, S, F>(namingUiSchema), [namingUiSchema]);
  const keyword = getXxxOfKey<S>(schema) ?? ONE_OF_KEY;
  const enumOptions = useMemo(
    () => computeEnumOptions(schema, schemaUtils, uiSchema, formData),
    [schema, schemaUtils, uiSchema, formData],
  );
  const firstOption = useMemo(() => getFirstOption<T, S, F>(schema, schemaUtils), [schema, schemaUtils]);
  const allUiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const selectorField = getSelectorField<T, S, F>(schema, allUiOptions);
  const {
    widget: _widget,
    title = '',
    placeholder = '',
    optionsSchemaSelector: _optionsSchemaSelector,
    hideError: _hideError,
    // The `FieldTemplate` applies these, so the widget mustn't apply them a second time (#439)
    classNames: _classNames,
    style: _style,
    ...uiOptions
  } = allUiOptions;
  if (!selectorField) {
    throw new Error('No selector field provided for the LayoutMultiSchemaField');
  }
  const selectedOption = getByPath(formData, selectorField);
  const { Widget } = resolveSelectorWidget<T, S, F>(schema, firstOption, selectorField, allUiOptions, widgets);

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

  return (
    <Widget
      id={id}
      name={name}
      schema={schema}
      disabled={disabled}
      uiSchema={uiSchema}
      autofocus={autofocus}
      readonly={readonly}
      required={required}
      registry={registry}
      multiple={false}
      {...getWidgetErrorProps<T, S, F>(rawErrors)}
      hideError={hideError}
      {...getWidgetLabelProps<T, S, F>(presentation, title || parentTitle || schema.title || name, () => true)}
      presentation={presentation}
      errorSchema={errorSchema}
      placeholder={placeholder}
      onChange={onOptionChange}
      onBlur={onBlur}
      onFocus={onFocus}
      value={selectedOption}
      options={widgetOptions}
      htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
    />
  );
}
