import { FocusEvent, SyntheticEvent } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  EnumOptionsType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  UIOptionsType,
} from '@rjsf/utils';
import map from 'lodash/map';
import { Form, DropdownProps, DropdownItemProps } from 'semantic-ui-react';
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
) {
  const disabledOptions = enumDisabled || [];
  const options: DropdownItemProps[] = map(enumOptions, ({ label, value }, index) => ({
    disabled: disabledOptions.indexOf(value) !== -1,
    key: label,
    text: label,
    value: String(index),
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
    formContext,
    id,
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
    formContext,
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
  const showPlaceholderOption = !multiple && schema.default === undefined;
  const dropdownOptions = createDefaultValueOptionsForDropDown<S>(
    enumOptions,
    enumDisabled,
    showPlaceholderOption,
    placeholder,
  );
  const _onChange = (_: SyntheticEvent<HTMLElement>, { value }: DropdownProps) =>
    onChange(enumOptionsValueForIndex<S>(value as string[], enumOptions, optEmptyVal));
  // eslint-disable-next-line no-shadow
  const _onBlur = (_: FocusEvent<HTMLElement>, { target }: DropdownProps) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const _onFocus = (_: FocusEvent<HTMLElement>, { target }: DropdownProps) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  return (
    <Form.Dropdown
      key={id}
      id={id}
      name={id}
      label={labelValue(label || undefined, hideLabel, false)}
      multiple={typeof multiple === 'undefined' ? false : multiple}
      value={typeof value === 'undefined' ? emptyValue : selectedIndexes}
      error={rawErrors.length > 0}
      disabled={disabled}
      placeholder={placeholder}
      {...semanticProps}
      required={required}
      autoFocus={autofocus}
      readOnly={readonly}
      options={dropdownOptions}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
