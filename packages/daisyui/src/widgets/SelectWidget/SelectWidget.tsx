import type { FocusEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type {
  EnumOptionsType,
  FormContextType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  enumOptionsDeselectValue,
  enumOptionValueLabel,
  enumOptionsIndexForValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  getControlFallbackName,
  groupEnumOptions,
  isEnumOptionsGroup,
  isNamedByTemplateLabel,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
  widgetAriaProps,
  widgetDrawsLabel,
} from '@rjsf/utils';

function getDisplayValue(val: unknown) {
  if (val === undefined || val === null) {
    return '';
  }
  if (typeof val === 'object') {
    if ('name' in val && val.name) {
      return enumOptionValueLabel(val.name);
    }
    if ('label' in val && val.label) {
      return enumOptionValueLabel(val.label);
    }
    return enumOptionValueLabel(val);
  }
  return enumOptionValueLabel(val);
}

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
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    options,
    label,
    presentation,
    disabled,
    placeholder,
    readonly,
    required,
    autofocus,
    value,
    multiple,
    onChange,
    onBlur,
    onFocus,
    registry,
    uiSchema,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const isMultiple = typeof multiple === 'undefined' ? false : multiple;

  // Without an `enum` the dropdown lists the schema's `examples`, so clicks and the selection are resolved against the
  // same list the dropdown renders
  const optionsList: EnumOptionsType<S>[] = useMemo(
    () =>
      enumOptions ??
      (Array.isArray(schema.examples)
        ? schema.examples.map((example) => ({ value: example, label: getDisplayValue(example) }))
        : []),
    [enumOptions, schema.examples],
  );

  const handleOptionClick = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      const index = Number(event.currentTarget.dataset.value);
      if (Number.isNaN(index)) {
        return;
      }

      // `data-value` is the option's index whatever the `optionValueFormat`, so it's resolved as one rather than
      // decoded as a DOM value
      const optionValue = enumOptionsValueForIndex<S>(String(index), optionsList, optEmptyVal);
      if (isMultiple) {
        const currentValue = Array.isArray(value) ? value : [];
        // Compared by value, since an object option in form data is rarely the same instance as the option's constant
        const newValue = enumOptionsIsSelected<S>(optionValue, currentValue, true)
          ? enumOptionsDeselectValue<S>(index, currentValue, optionsList)
          : enumOptionsSelectValue<S>(index, currentValue, optionsList);
        onChange(newValue);
      } else {
        onChange(optionValue);
      }
    },
    [value, isMultiple, optionsList, optEmptyVal, onChange],
  );

  const { handleFocus: reportFocus, handleBlur: reportBlur } = useSelectFocusHandlers<T, S, F>({
    id,
    value,
    options,
    onFocus,
    onBlur,
  });

  // The dropdown opens while focus is inside it, so its trigger is expanded exactly then
  const [expanded, setExpanded] = useState(false);
  // Focus moves between the button and the options while the dropdown is in use, so only entering or leaving the
  // dropdown as a whole counts as focusing or blurring the widget, which reports the current selection
  const handleBlur = useCallback(
    ({ currentTarget, relatedTarget }: FocusEvent<HTMLDivElement>) => {
      if (!currentTarget.contains(relatedTarget)) {
        setExpanded(false);
        reportBlur();
      }
    },
    [reportBlur],
  );

  const handleFocus = useCallback(
    ({ currentTarget, relatedTarget }: FocusEvent<HTMLDivElement>) => {
      if (!currentTarget.contains(relatedTarget)) {
        setExpanded(true);
        reportFocus();
      }
    },
    [reportFocus],
  );

  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, isMultiple);
  const selectedIndexes = [enumOptionsIndexForValue<S>(value, optionsList, isMultiple) ?? []].flat();
  const selectedLabels = selectedIndexes.map((index) => optionsList[Number(index)].label);
  const hasValue = selectedLabels.length > 0;
  const ariaProps = widgetAriaProps(props);
  const listboxId = `${id}__listbox`;
  // A combobox takes no name from its contents, which are its value, so with no label or `aria-label` naming it, it is
  // named by the field's label, as the label drawn for it would, or, for a field with no title, such as an array item
  // or an untitled option selector, by its placeholder, else the translated prompt, as `DatePickerTrigger` is. The plan
  // points it at a label through `aria-labelledby` only where `isNamedByTemplateLabel()` already reports one
  const named = isNamedByTemplateLabel<T, S, F>(props);
  const fallbackName = getControlFallbackName<T, S, F>({ label, placeholder, registry });

  function renderOption(option: IndexedEnumOptionType<S>) {
    const isSelected = selectedIndexes.includes(String(option.index));
    // A disabled or readonly field's options can't be chosen, though they stay reachable, so its value stays readable
    const optionDisabled = disabled || readonly || option.disabled;
    return (
      <li
        key={option.index}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role='option'
        aria-selected={isSelected}
        aria-disabled={optionDisabled || undefined}
        tabIndex={option.disabled ? -1 : 0}
        className={`px-4 py-2 ${optionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-base-200 cursor-pointer'} ${
          isSelected ? 'bg-primary/10' : ''
        }`}
        onClick={optionDisabled ? undefined : handleOptionClick}
        onKeyDown={(e) =>
          !optionDisabled &&
          (e.key === 'Enter' || e.key === ' ') &&
          handleOptionClick(e as unknown as React.MouseEvent<HTMLLIElement>)
        }
        data-value={option.index}
      >
        <div className='flex items-center gap-2'>
          {isMultiple && <input type='checkbox' className='checkbox checkbox-sm' checked={isSelected} readOnly />}
          <span>{option.label}</span>
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
          // Disabled only through `aria-disabled`, so it would still take focus and open its listbox on mount, which a
          // disabled native control can't
          autoFocus={autofocus && !disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            event.currentTarget.focus();
          }}
          className={`btn btn-outline w-full text-left flex justify-between items-center ${
            disabled || readonly ? 'btn-disabled' : ''
          }`}
          /* A combobox, as a native select is, so it can be `aria-invalid` while its errors show, which a button can't,
             and announces the option it displays as its value */
          role='combobox'
          aria-haspopup='listbox'
          aria-expanded={expanded}
          aria-controls={listboxId}
          {...ariaProps}
          aria-label={ariaProps['aria-label'] ?? (named ? undefined : fallbackName)}
          aria-disabled={disabled || readonly || undefined}
          // A button takes no `required`, so the combobox says it as a native select's attribute would
          aria-required={required || undefined}
        >
          <span className='truncate'>{hasValue ? selectedLabels.join(', ') : placeholder || fallbackName}</span>
          {/* Decoration, and hidden from the value the combobox's contents give it, which would otherwise end in the
              glyph's own spoken name */}
          <span aria-hidden className='ml-2'>
            ▼
          </span>
        </button>
        <ul
          id={listboxId}
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
          role='listbox'
          aria-multiselectable={isMultiple || undefined}
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
        hideLabel={hideLabel}
        presentation={presentation}
      />
    </div>
  );
}
