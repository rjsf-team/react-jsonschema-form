import { useCallback, useMemo } from 'react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import { getGroupProps } from '../../utils.ts';

/** The `CheckboxesWidget` component renders a set of checkboxes for multiple choice selection
 * with DaisyUI styling.
 *
 * Features:
 * - Supports both primitive values and objects in enum options
 * - Handles array values with proper state management
 * - Uses DaisyUI checkbox styling with accessible labels
 * - Supports disabled and readonly states
 * - Provides focus and blur event handling for accessibility
 * - Uses vertical layout for better spacing and readability
 * - Uses memoized handlers for optimal performance
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  name,
  disabled,
  options,
  value,
  label,
  hideLabel,
  readonly,
  onChange,
  onFocus,
  onBlur,
}: WidgetProps<T, S, F>) {
  const { enumOptions } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const selected = useMemo((): unknown[] => (Array.isArray(value) ? value : []), [value]);

  /** Handles changes to a checkbox's checked state */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.dataset.index);
      const option = enumOptions?.[index];
      if (!option) {
        return;
      }

      // Compared by value, since an object option in form data is rarely the same instance as the option's constant
      if (enumOptionsIsSelected<S>(option.value, selected)) {
        onChange(enumOptionsDeselectValue<S>(index, selected, enumOptions));
      } else {
        onChange(enumOptionsSelectValue<S>(index, selected, enumOptions));
      }
    },
    [onChange, selected, enumOptions],
  );

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  return (
    <div className='form-control'>
      {/* Use a vertical layout with proper spacing */}
      <div className='flex flex-col gap-2 mt-1' {...getGroupProps({ id, label, name, hideLabel, role: 'group' })}>
        {enumOptions?.map((option, index) => (
          // oxlint-disable-next-line react/no-array-index-key
          <label key={index} className='flex items-center cursor-pointer gap-2'>
            <input
              type='checkbox'
              id={optionId(id, index)}
              className='checkbox'
              name={htmlName || id}
              value={domValues[index]}
              checked={enumOptionsIsSelected<S>(option.value, selected)}
              disabled={disabled || readonly}
              data-index={index}
              onChange={handleChange}
              onFocus={focusHandlers[index]}
              onBlur={blurHandlers[index]}
            />
            <span className='label-text'>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
