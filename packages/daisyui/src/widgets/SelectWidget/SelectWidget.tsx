import {
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { ChangeEvent, FocusEvent } from 'react';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  placeholder,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, emptyValue: optEmptyVal } = options;
  multiple = typeof multiple === 'undefined' ? false : !!multiple;
  const dataListId = `${id}-datalist`;

  const getDisplayValue = (val: any) => {
    if (!val) return '';
    if (typeof val === 'object') {
      if (val.name) return val.name;
      return val.label || JSON.stringify(val);
    }
    return String(val);
  };

  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';
  const shouldUseSelect = isEnumeratedObject || schema.examples;

  const _onChange = ({ target: { value } }: ChangeEvent<{ value: string }>) => {
    if (shouldUseSelect) {
      const idx = parseInt(value);
      onChange(
        isEnumeratedObject ? enumOptions[idx].value : enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal)
      );
    } else {
      let selectedOption = null;
      if (optionsList) {
        for (let i = 0; i < optionsList.length; i++) {
          if (getDisplayValue(optionsList[i].label) === value) {
            selectedOption = optionsList[i];
            break;
          }
        }
      }
      onChange(selectedOption ? selectedOption.value : value);
    }
  };
  const _onBlur = ({ target }: FocusEvent<HTMLSelectElement | HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const _onFocus = ({ target }: FocusEvent<HTMLSelectElement | HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, optEmptyVal));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const showPlaceholderOption = !multiple && schema.default === undefined;

  const optionsList =
    enumOptions ||
    (Array.isArray(schema.examples) ? schema.examples.map((example) => ({ value: example, label: example })) : []);

  return (
    <div className='form-control w-full'>
      {shouldUseSelect ? (
        <select
          id={id}
          className='select select-bordered w-full'
          value={selectedIndexes}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onBlur={_onBlur}
          onFocus={_onFocus}
          onChange={_onChange}
        >
          {showPlaceholderOption && <option value=''>{placeholder || label || ''}</option>}
          {optionsList.map(({ value, label }, i) => (
            <option key={i} value={i}>
              {isEnumeratedObject ? label : getDisplayValue(label)}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input
            id={id}
            className='input input-bordered w-full'
            type='text'
            value={getDisplayValue(value)}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            placeholder={placeholder || label}
            list={dataListId}
            onBlur={_onBlur}
            onFocus={_onFocus}
            onChange={_onChange}
          />
          <datalist id={dataListId}>
            {optionsList.map(({ value, label }, i) => (
              <option key={i} value={getDisplayValue(label)}>
                {getDisplayValue(label)}
              </option>
            ))}
          </datalist>
        </>
      )}
    </div>
  );
}
