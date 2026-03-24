import { ChangeEvent, FocusEvent, ReactNode } from 'react';
import FormSelect from 'react-bootstrap/FormSelect';
import {
  ariaDescribedByIds,
  FormContextType,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue, optgroups } = options;

  const emptyValue = multiple ? [] : '';

  function getValue(event: FocusEvent | ChangeEvent | any, multiple?: boolean) {
    if (multiple) {
      return [].slice
        .call(event.target.options as any)
        .filter((o: any) => o.selected)
        .map((o: any) => o.value);
    } else {
      return event.target.value;
    }
  }
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const showPlaceholderOption = !multiple && schema.default === undefined;

  function renderOption(i: number): ReactNode {
    if (!Array.isArray(enumOptions) || !enumOptions[i]) {
      return null;
    }
    const { value, label } = enumOptions[i];
    const isDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1;
    return (
      <option key={i} id={label} value={String(i)} disabled={isDisabled}>
        {label}
      </option>
    );
  }

  function renderOptions(): ReactNode {
    if (!Array.isArray(enumOptions)) {
      return null;
    }

    if (optgroups && typeof optgroups === 'object') {
      const valueToIndex = new Map<any, number>();
      enumOptions.forEach(({ value }, i) => {
        valueToIndex.set(value, i);
      });

      const groupedIndices = new Set<number>();

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

    return enumOptions.map((_, i) => renderOption(i));
  }

  return (
    <FormSelect
      id={id}
      name={htmlName || id}
      value={typeof selectedIndexes === 'undefined' ? emptyValue : selectedIndexes}
      required={required}
      multiple={multiple}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      className={rawErrors.length > 0 ? 'is-invalid' : ''}
      onBlur={
        onBlur &&
        ((event: FocusEvent) => {
          const newValue = getValue(event, multiple);
          onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
        })
      }
      onFocus={
        onFocus &&
        ((event: FocusEvent) => {
          const newValue = getValue(event, multiple);
          onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
        })
      }
      onChange={(event: ChangeEvent) => {
        const newValue = getValue(event, multiple);
        onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
      }}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {showPlaceholderOption && <option value=''>{placeholder}</option>}
      {renderOptions()}
    </FormSelect>
  );
}
