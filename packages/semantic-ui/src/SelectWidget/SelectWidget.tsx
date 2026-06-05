import type { FocusEvent, SyntheticEvent } from 'react';
import type {
  EnumOptionsType,
  FormContextType,
  OptionValueFormat,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  UIOptionsType,
} from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  labelValue,
} from '@rjsf/utils';
import map from 'lodash/map';
import type { DropdownProps, DropdownItemProps } from 'semantic-ui-react';
import { Form } from 'semantic-ui-react';

import { getSemanticProps } from '../util';

/**
 * Returns and creates an array format required for semantic drop down
 * @param {array} enumOptions - array of items for the dropdown
 * @param {array} enumDisabled - array of enum option values to disable
 * @param {boolean} showPlaceholderOption - whether to show a placeholder option
 * @param {string} placeholder - placeholder option label
 * @returns {*}
 */
function createDefaultValueOptionsForDropDown<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions?: EnumOptionsType<S>[],
  enumDisabled?: UIOptionsType['enumDisabled'],
  showPlaceholderOption?: boolean,
  placeholder?: string,
  format: OptionValueFormat = 'indexed',
) {
  const disabledOptions = enumDisabled || [];
  const options: DropdownItemProps[] = map(enumOptions, ({ label, value }, index) => ({
    disabled: disabledOptions.includes(value),
    key: label,
    text: label,
    value: enumOptionValueEncoder(value, index, format),
  }));
  if (showPlaceholderOption) {
    options.unshift({ value: '', text: placeholder || '' });
  }
  return options;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    uiSchema,
    registry,
    id,
    htmlName,
    options,
    label,
    hideLabel,
    required,
    disabled,
    readonly,
    value,
    multiple,
    placeholder,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    schema,
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options,
    defaultSchemaProps: {
      inverted: 'false',
      selection: true,
      fluid: true,
      scrolling: true,
      upward: false,
    },
  });
  const { enumDisabled, enumOptions, emptyValue: optEmptyVal } = options;
  const emptyValue = multiple ? [] : '';
  const optionValueFormat = getOptionValueFormat(options);
  const showPlaceholderOption = !multiple && schema.default === undefined;
  const dropdownOptions = createDefaultValueOptionsForDropDown<S>(
    enumOptions,
    enumDisabled,
    showPlaceholderOption,
    placeholder,
    optionValueFormat,
  );
  const handleChange = (_: SyntheticEvent<HTMLElement>, { value: enumValue }: DropdownProps) =>
    onChange(enumOptionValueDecoder<S>(enumValue as string[], enumOptions, optionValueFormat, optEmptyVal));
  const handleBlur = (_: FocusEvent<HTMLElement>, { target }: DropdownProps) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleFocus = (_: FocusEvent<HTMLElement>, { target }: DropdownProps) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, optEmptyVal));
  return (
    <Form.Dropdown
      key={id}
      id={id}
      name={htmlName || id}
      label={labelValue(label || undefined, hideLabel, false)}
      multiple={typeof multiple === 'undefined' ? false : multiple}
      value={enumOptionSelectedValue<S>(value, enumOptions, !!multiple, optionValueFormat, emptyValue)}
      error={rawErrors.length > 0}
      disabled={disabled}
      placeholder={placeholder}
      {...semanticProps}
      required={required}
      autoFocus={autofocus}
      readOnly={readonly}
      options={dropdownOptions}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
