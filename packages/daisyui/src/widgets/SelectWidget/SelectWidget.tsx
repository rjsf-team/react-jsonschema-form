import { FocusEvent, useCallback } from 'react';
import {
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

/** The `SelectWidget` component renders a select input with DaisyUI styling
 *
 * Features:
 * - Supports both single and multiple selection
 * - Handles enumerated objects and primitive values
 * - Uses DaisyUI select styling with proper width
 * - Supports required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Provides placeholder option when needed
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  options,
  label,
  disabled,
  placeholder,
  readonly,
  value,
  multiple,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, emptyValue: optEmptyVal } = options;
  multiple = typeof multiple === 'undefined' ? false : !!multiple;

  const getDisplayValue = (val: any) => {
    if (!val) {
      return '';
    }
    if (typeof val === 'object') {
      if (val.name) {
        return val.name;
      }
      return val.label || JSON.stringify(val);
    }
    return String(val);
  };

  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  const handleOptionClick = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      const index = Number(event.currentTarget.dataset.value);
      if (isNaN(index)) {
        return;
      }

      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        const optionValue = isEnumeratedObject
          ? enumOptions[index].value
          : enumOptionsValueForIndex<S>(String(index), enumOptions, optEmptyVal);
        const newValue = currentValue.includes(optionValue)
          ? currentValue.filter((v) => v !== optionValue)
          : [...currentValue, optionValue];
        onChange(newValue);
      } else {
        onChange(
          isEnumeratedObject
            ? enumOptions[index].value
            : enumOptionsValueForIndex<S>(String(index), enumOptions, optEmptyVal),
        );
      }
    },
    [value, multiple, isEnumeratedObject, enumOptions, optEmptyVal, onChange],
  );

  const _onBlur = useCallback(
    ({ target }: FocusEvent<HTMLDivElement>) => {
      const dataValue = target?.getAttribute('data-value');
      if (dataValue !== null) {
        onBlur(id, enumOptionsValueForIndex<S>(dataValue, enumOptions, optEmptyVal));
      }
    },
    [onBlur, id, enumOptions, optEmptyVal],
  );

  const _onFocus = useCallback(
    ({ target }: FocusEvent<HTMLDivElement>) => {
      const dataValue = target?.getAttribute('data-value');
      if (dataValue !== null) {
        onFocus(id, enumOptionsValueForIndex<S>(dataValue, enumOptions, optEmptyVal));
      }
    },
    [onFocus, id, enumOptions, optEmptyVal],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const selectedValues = Array.isArray(selectedIndexes) ? selectedIndexes : [selectedIndexes];

  const optionsList =
    enumOptions ||
    (Array.isArray(schema.examples) ? schema.examples.map((example) => ({ value: example, label: example })) : []);

  return (
    <div className='form-control w-full'>
      <div className='dropdown w-full'>
        <div
          tabIndex={0}
          role='button'
          className={`btn btn-outline w-full text-left flex justify-between items-center ${
            disabled || readonly ? 'btn-disabled' : ''
          }`}
          onBlur={_onBlur}
          onFocus={_onFocus}
        >
          <span className='truncate'>
            {selectedValues.length > 0
              ? selectedValues.map((index) => optionsList[Number(index)]?.label).join(', ')
              : placeholder || label || 'Select...'}
          </span>
          <span className='ml-2'>▼</span>
        </div>
        <ul className='dropdown-content z-[1] bg-base-100 w-full max-h-60 overflow-auto rounded-box shadow-lg'>
          {optionsList.map(({ label }, i) => (
            <li
              key={i}
              role='button'
              tabIndex={0}
              className={`px-4 py-2 hover:bg-base-200 cursor-pointer ${
                selectedValues.includes(String(i)) ? 'bg-primary/10' : ''
              }`}
              onClick={handleOptionClick}
              data-value={i}
            >
              <div className='flex items-center gap-2'>
                {multiple && (
                  <input
                    type='checkbox'
                    className='checkbox checkbox-sm'
                    checked={selectedValues.includes(String(i))}
                    readOnly
                  />
                )}
                <span>{isEnumeratedObject ? label : getDisplayValue(label)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
