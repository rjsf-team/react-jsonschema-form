import type { ChangeEvent, FocusEvent, SyntheticEvent } from 'react';
import { useCallback, useMemo } from 'react';
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

/** A multiple select only ever reports its selection in document order, and `optgroups` is presentational, so the
 * options are put back into enum order via `enumIndexByPosition` before they reach form data: turning a group on or
 * off must not reorder the array a form submits.
 */
function getValue(event: SyntheticEvent<HTMLSelectElement>, multiple: boolean, enumIndexByPosition: number[]) {
  const select = event.target as HTMLSelectElement;
  if (multiple) {
    return Array.from(select.options)
      .map((option, position) => ({ option, position }))
      .filter(({ option }) => option.selected)
      .sort((a, b) => enumIndexByPosition[a.position] - enumIndexByPosition[b.position])
      .map(({ option }) => option.value);
  }
  return select.value;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  schema,
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  multiple = false,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  htmlName,
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const emptyValue = multiple ? [] : '';
  const optionValueFormat = getOptionValueFormat(options);

  const groupedOptions = useMemo(
    () => groupEnumOptions<S>(enumOptions, optgroups, enumDisabled),
    [enumOptions, optgroups, enumDisabled],
  );
  const enumIndexByPosition = useMemo(
    () => flattenGroupedOptions<S>(groupedOptions).map((option) => option.index),
    [groupedOptions],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple, enumIndexByPosition);
      return onFocus(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal, optionValueFormat, enumIndexByPosition],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple, enumIndexByPosition);
      return onBlur(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal, optionValueFormat, enumIndexByPosition],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple, enumIndexByPosition);
      return onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
    },
    [onChange, multiple, enumOptions, optEmptyVal, optionValueFormat, enumIndexByPosition],
  );

  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, multiple, optionValueFormat, emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  function renderOption(option: IndexedEnumOptionType<S>) {
    return (
      <option
        key={option.index}
        value={enumOptionValueEncoder(option.value, option.index, optionValueFormat)}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    );
  }

  return (
    <>
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
      />
      {/* oxlint-disable-next-line jsx-a11y/no-autofocus */}
      <select
        id={id}
        name={htmlName || id}
        multiple={multiple}
        className='form-control'
        value={selectValue}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={handleChange}
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
      </select>
    </>
  );
}

export default SelectWidget;
