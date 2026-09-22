import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  flattenGroupedOptions,
  getOptionValueFormat,
  groupEnumOptions,
  isEnumOptionsGroup,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';
import { FormSelect } from 'react-bootstrap';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  htmlName,
  options,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors = [],
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue, optgroups } = options;

  const emptyValue = multiple ? [] : '';
  const optionValueFormat = getOptionValueFormat(options);

  const groupedOptions = groupEnumOptions<S>(enumOptions, optgroups, enumDisabled);
  const enumIndexByPosition = flattenGroupedOptions<S>(groupedOptions).map((option) => option.index);

  /** A multiple select only ever reports its selection in document order, and `optgroups` is presentational, so the
   * options are put back into enum order before they reach form data: turning a group on or off must not reorder the
   * array a form submits.
   */
  function getValue(event: FocusEvent | ChangeEvent | any, isMultiple?: boolean) {
    if (isMultiple) {
      return Array.from<HTMLOptionElement>(event.target.options)
        .map((option, position) => ({ option, position }))
        .filter(({ option }) => option.selected)
        .sort((a, b) => enumIndexByPosition[a.position] - enumIndexByPosition[b.position])
        .map(({ option }) => option.value);
    }
    return event.target.value;
  }
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, !!multiple, optionValueFormat, emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  function renderOption(option: IndexedEnumOptionType<S>) {
    return (
      <option
        key={option.index}
        id={option.label}
        value={enumOptionValueEncoder(option.value, option.index, optionValueFormat)}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    );
  }

  return (
    <>
      <FormSelect
        id={id}
        name={htmlName || id}
        value={selectValue}
        required={required}
        multiple={multiple}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        className={rawErrors.length > 0 ? 'is-invalid' : ''}
        onBlur={
          onBlur &&
          ((event: FocusEvent) => {
            const newValue = getValue(event, multiple);
            onBlur(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyValue));
          })
        }
        onFocus={
          onFocus &&
          ((event: FocusEvent) => {
            const newValue = getValue(event, multiple);
            onFocus(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyValue));
          })
        }
        onChange={(event: ChangeEvent) => {
          const newValue = getValue(event, multiple);
          onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyValue));
        }}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {showPlaceholderOption && <option value=''>{placeholder}</option>}
        {groupedOptions.map((item) =>
          isEnumOptionsGroup<S>(item) ? (
            <optgroup key={`optgroup-${item.label}`} label={item.label}>
              {item.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(item)
          ),
        )}
      </FormSelect>
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
      />
    </>
  );
}
