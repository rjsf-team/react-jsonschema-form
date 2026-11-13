import { useMemo } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { getByPath, fieldPathToName, getUiOptions, toFieldPath } from '@rjsf/utils';

import useOptionSwitch from '../../hooks/useOptionSwitch.ts';
import useSendBlur from '../../hooks/useSendBlur.ts';
import { retrievedOptionListOf } from '../uiState.ts';
import { getWidgetErrorProps, getWidgetLabelProps } from './fieldWidgetUtils.ts';
import {
  computeEnumOptions,
  getFirstOption,
  getSelectedOptionIndex,
  getSelectorField,
  resolveSelectorWidget,
} from './layoutMultiSchemaFieldSelector.ts';
import { withoutNamedField } from './namedField.ts';

/** Returns the field's `uiSchema` without the `ui:field` and `ui:fieldReplacesAnyOrOneOf` that had `SchemaField` render
 * this field in place of the options. A layout grid writes them into a cell's `uiSchema` itself, and
 * they mean nothing to the selector widget or to the option a switch selects, whose uiSchema falls back to this one
 *
 * @param uiSchema - The uiSchema of the field
 * @returns - `uiSchema` itself when it holds neither directive, else a copy without them
 */
function omitFieldDirectives<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F> | undefined,
): UiSchema<T, S, F> | undefined {
  if (!uiSchema) {
    return uiSchema;
  }
  const withoutField = withoutNamedField<T, S, F>(uiSchema);
  if (withoutField['ui:fieldReplacesAnyOrOneOf'] === undefined) {
    return withoutField;
  }
  const strippedUiSchema: UiSchema<T, S, F> = { ...withoutField };
  delete strippedUiSchema['ui:fieldReplacesAnyOrOneOf'];
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
 * deprecation handling, as for any other field. Its selector is disabled too when there are no options to select
 */
export default function LayoutMultiSchemaField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    name,
    disabled: fieldDisabled = false,
    formData,
    fieldPath,
    id,
    onBlur,
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
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const options = useMemo(
    () => retrievedOptionListOf<T, S, F>(schemaUtils, schema, formData) ?? [],
    [schemaUtils, schema, formData],
  );
  const uiSchema = useMemo(() => omitFieldDirectives<T, S, F>(namingUiSchema), [namingUiSchema]);
  const enumOptions = useMemo(
    () => computeEnumOptions(schema, schemaUtils, uiSchema, formData),
    [schema, schemaUtils, uiSchema, formData],
  );
  const disabled = fieldDisabled || enumOptions.length === 0;
  // The selector names the option, but a cell of the grid shows the one the form selects for these options
  const { switchOption } = useOptionSwitch<T, S, F>({ ...props, uiSchema, disabled }, options);
  const allUiOptions = useMemo(() => getUiOptions<T, S, F>(uiSchema, globalUiOptions), [uiSchema, globalUiOptions]);
  const selectorField = getSelectorField<T, S, F>(schema, allUiOptions);
  if (!selectorField) {
    throw new Error('No selector field provided for the LayoutMultiSchemaField');
  }
  // Its widget writes the selector field, so its blur touches that field, as a widget bound to it would
  const handleBlur = useSendBlur(toFieldPath(selectorField, fieldPath), onBlur, 'field');
  const firstOption = useMemo(
    () => getFirstOption<T, S, F>(schema, schemaUtils, selectorField),
    [schema, schemaUtils, selectorField],
  );
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
  const selectedOption = getByPath(formData, selectorField);
  const { Widget } = resolveSelectorWidget<T, S, F>(schema, firstOption, selectorField, allUiOptions, widgets);

  /** Switches to the option `opt` names, or clears the selection where it names none
   *
   * @param opt - The value of the selector field the widget picked
   */
  const onOptionChange = (opt?: unknown) =>
    // The selector cell's value is the field's own write, which the form keeps rather than putting the old one back. It
    // judges every other key the data held against the option switched away from
    switchOption(getSelectedOptionIndex<S>(enumOptions, selectorField, opt), { [selectorField]: opt });

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
      onBlur={handleBlur}
      onFocus={onFocus}
      value={selectedOption}
      options={widgetOptions}
      htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
    />
  );
}
