import { ChangeEvent, FocusEvent, ReactNode, SyntheticEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

function getValue(event: SyntheticEvent<HTMLSelectElement>, multiple: boolean) {
  if (multiple) {
    return Array.from((event.target as HTMLSelectElement).options)
      .slice()
      .filter((o) => o.selected)
      .map((o) => o.value);
  }
  return (event.target as HTMLSelectElement).value;
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const emptyValue = multiple ? [] : '';

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal));
    },
    [onChange, multiple, enumOptions, optEmptyVal],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const showPlaceholderOption = !multiple && schema.default === undefined;

  function renderOption(i: number): ReactNode {
    if (!Array.isArray(enumOptions) || !enumOptions[i]) {
      return null;
    }
    const { value, label } = enumOptions[i];
    const isDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1;
    return (
      <option key={i} value={String(i)} disabled={isDisabled}>
        {label}
      </option>
    );
  }

  function renderOptions(): ReactNode {
    if (!Array.isArray(enumOptions)) {
      return null;
    }

    if (optgroups && typeof optgroups === 'object') {
      // Build a map from enum value to its index in enumOptions
      const valueToIndex = new Map<any, number>();
      enumOptions.forEach(({ value }, i) => {
        valueToIndex.set(value, i);
      });

      // Track which indices are used in groups
      const groupedIndices = new Set<number>();

      // Render optgroups
      const groups = Object.entries(optgroups).map(([label, values]) => {
        const groupOptions = (values as any[])
          .map((val) => {
            const idx = valueToIndex.get(val);
            if (idx === undefined) {
              return null;
            }
            groupedIndices.add(idx);
            return renderOption(idx);
          })
          .filter(Boolean);

        return (
          <optgroup key={label} label={label}>
            {groupOptions}
          </optgroup>
        );
      });

      // Render ungrouped options
      const ungrouped = enumOptions
        .map((_, i) => {
          if (groupedIndices.has(i)) {
            return null;
          }
          return renderOption(i);
        })
        .filter(Boolean);

      return (
        <>
          {groups}
          {ungrouped}
        </>
      );
    }

    // Default: flat list
    return enumOptions.map((_, i) => renderOption(i));
  }

  return (
    <select
      id={id}
      name={htmlName || id}
      multiple={multiple}
      role='combobox'
      className='form-control'
      value={typeof selectedIndexes === 'undefined' ? emptyValue : selectedIndexes}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {showPlaceholderOption && <option value=''>{placeholder}</option>}
      {renderOptions()}
    </select>
  );
}

export default SelectWidget;
