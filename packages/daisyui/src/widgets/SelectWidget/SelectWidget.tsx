import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import type {
  EnumOptionsType,
  FormContextType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  enumOptionValueEncoder,
  getOptionValueFormat,
  groupEnumOptions,
  isEnumOptionsGroup,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const isMultiple = typeof multiple === 'undefined' ? false : multiple;

  const getDisplayValue = (val: any) => {
    if (val === undefined || val === null) {
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
      if (Number.isNaN(index)) {
        return;
      }

      // `data-value` is the option's index whatever the `optionValueFormat`, so it's resolved as one rather than
      // decoded as a DOM value
      const optionValue = enumOptionsValueForIndex<S>(String(index), enumOptions, optEmptyVal);
      if (isMultiple) {
        const currentValue = Array.isArray(value) ? value : [];
        // Compared by value, since an object option in form data is rarely the same instance as the option's constant
        const newValue = enumOptionsIsSelected<S>(optionValue, currentValue)
          ? enumOptionsDeselectValue<S>(index, currentValue, enumOptions)
          : [...currentValue, optionValue];
        onChange(newValue);
      } else {
        onChange(optionValue);
      }
    },
    [value, isMultiple, enumOptions, optEmptyVal, onChange],
  );

  // Focus moves between the button and the options while the dropdown is in use, so only entering or leaving the
  // dropdown as a whole counts as focusing or blurring the widget, which reports the current selection
  const handleBlur = useCallback(
    ({ currentTarget, relatedTarget }: FocusEvent<HTMLDivElement>) => {
      if (!currentTarget.contains(relatedTarget)) {
        onBlur(id, value);
      }
    },
    [onBlur, id, value],
  );

  const handleFocus = useCallback(
    ({ currentTarget, relatedTarget }: FocusEvent<HTMLDivElement>) => {
      if (!currentTarget.contains(relatedTarget)) {
        onFocus(id, value);
      }
    },
    [onFocus, id, value],
  );

  // The custom dropdown iterates `selectedValues.includes(...)` per option, so
  // it always needs a string array regardless of `multiple`. Flatten the
  // helper's single/multiple return shape and strip the empty-single case.
  const selectedValues: string[] = [
    enumOptionSelectedValue<S>(value, enumOptions, isMultiple, optionValueFormat, isMultiple ? [] : ''),
  ]
    .flat()
    .filter((v) => v !== '');

  const optionsList: EnumOptionsType<S>[] =
    enumOptions ||
    (Array.isArray(schema.examples)
      ? schema.examples.map((example) => ({ value: example, label: getDisplayValue(example) }))
      : []);
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, isMultiple);
  // Looked up by encoded value, which is an option's index only in the `indexed` format
  const selectedLabels = optionsList
    .filter((option, index) => selectedValues.includes(enumOptionValueEncoder(option.value, index, optionValueFormat)))
    .map((option) => option.label);

  function renderOption(option: IndexedEnumOptionType<S>) {
    const encodedValue = enumOptionValueEncoder(option.value, option.index, optionValueFormat);
    return (
      <li
        key={option.index}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role='option'
        aria-selected={selectedValues.includes(encodedValue)}
        aria-disabled={option.disabled || undefined}
        tabIndex={option.disabled ? -1 : 0}
        className={`px-4 py-2 ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-base-200 cursor-pointer'} ${
          selectedValues.includes(encodedValue) ? 'bg-primary/10' : ''
        }`}
        onClick={option.disabled ? undefined : handleOptionClick}
        onKeyDown={(e) =>
          !option.disabled &&
          (e.key === 'Enter' || e.key === ' ') &&
          handleOptionClick(e as unknown as React.MouseEvent<HTMLLIElement>)
        }
        data-value={option.index}
      >
        <div className='flex items-center gap-2'>
          {isMultiple && (
            <input
              type='checkbox'
              className='checkbox checkbox-sm'
              checked={selectedValues.includes(encodedValue)}
              readOnly
            />
          )}
          <span>{isEnumeratedObject ? option.label : getDisplayValue(option.label)}</span>
        </div>
      </li>
    );
  }

  return (
    <div className='form-control w-full'>
      <div className='dropdown w-full' onBlur={handleBlur} onFocus={handleFocus}>
        {/* A real `button` rather than the `div role='button'` daisyui's own markup uses: `label htmlFor` only
            associates with a labelable element, so on a `div` the key label and the `FieldTemplate` label both point
            at nothing. `type='button'` keeps it from submitting the form it sits in, and the explicit focus covers
            Safari and Firefox on macOS, which by platform convention do not focus a button on click — the dropdown
            opens on `:focus-within`, so without it the menu would not open for a mouse user there. Focusing without
            suppressing the default would not survive it: the default mousedown action runs after this handler, and
            it clears focus when the element it hits is not mouse-focusable, which is exactly what a button is there. */}
        <button
          id={id}
          type='button'
          tabIndex={0}
          onMouseDown={(event) => {
            event.preventDefault();
            event.currentTarget.focus();
          }}
          className={`btn btn-outline w-full text-left flex justify-between items-center ${
            disabled || readonly ? 'btn-disabled' : ''
          }`}
        >
          <span className='truncate'>
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder || label || 'Select...'}
          </span>
          <span className='ml-2'>▼</span>
        </button>
        <ul
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
          role='listbox'
          className='dropdown-content z-[1] bg-base-100 w-full max-h-60 overflow-auto rounded-box shadow-lg'
        >
          {groupEnumOptions<S>(optionsList, optgroups, enumDisabled).map((item) =>
            isEnumOptionsGroup<S>(item) ? (
              <li key={`optgroup-${item.label}`} role='presentation'>
                <ul role='group' aria-label={item.label}>
                  <li aria-hidden className='px-4 py-1 text-xs font-semibold uppercase opacity-60'>
                    {item.label}
                  </li>
                  {item.options.map(renderOption)}
                </ul>
              </li>
            ) : (
              renderOption(item)
            ),
          )}
        </ul>
      </div>
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
      />
    </div>
  );
}
