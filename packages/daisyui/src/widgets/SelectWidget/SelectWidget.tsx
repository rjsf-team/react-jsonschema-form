import type { FocusEvent, KeyboardEvent, SyntheticEvent } from 'react';
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  getControlAriaLabel,
  getControlFallbackName,
  groupEnumOptions,
  isEnumOptionsGroup,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
  widgetAriaProps,
  widgetDrawsLabel,
} from '@rjsf/utils';

/** The options a user moves between with the arrow keys: every one but those `ui:enumDisabled` disables, as a disabled
 * or readonly field's options stay reachable so its value stays readable. Marked by an attribute of their own, since a
 * disabled field's options carry `aria-disabled` too, and every option is out of the tab order
 */
const REACHABLE_OPTION = '[role="option"]:not([data-enum-disabled])';

/** The option an arrow key, Home or End moves to from the one holding focus, or for the trigger, which Down and Up
 * Arrow open the listbox from, the selected option, else the first one (Down) or the last (Up), and Home and End open
 * onto the first or the last
 *
 * @param listbox - The listbox
 * @param from - The element the key was pressed on, the trigger, an option or an element inside one
 * @param key - The key pressed
 * @returns - The option to focus, or `undefined` where the key moves nowhere
 */
function optionToFocus(listbox: HTMLElement, from: EventTarget, key: string) {
  if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') {
    return undefined;
  }
  const options = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
  const isReachable = (option: HTMLElement) => option.matches(REACHABLE_OPTION);
  if (key === 'Home') {
    return options.find(isReachable);
  }
  if (key === 'End') {
    return options.findLast(isReachable);
  }
  const down = key === 'ArrowDown';
  const fromOption = (from as Element).closest?.<HTMLElement>('[role="option"]');
  if (!fromOption) {
    const selected = options.find((option) => isReachable(option) && option.getAttribute('aria-selected') === 'true');
    return selected ?? (down ? options.find(isReachable) : options.findLast(isReachable));
  }
  // Stepped from the option's place among all of them, since a click focuses an option `ui:enumDisabled` disables too,
  // which the arrows otherwise skip; at either end focus stays where it is
  const current = options.indexOf(fromOption);
  const next = down ? options.slice(current + 1).find(isReachable) : options.slice(0, current).findLast(isReachable);
  return next ?? fromOption;
}

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
    (event: SyntheticEvent<HTMLLIElement>) => {
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

  // The dropdown opens while focus is inside it, so its trigger is expanded exactly then, unless Escape dismissed it,
  // which leaves focus on the trigger and so closes the dropdown through `dropdown-close` rather than by moving focus
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  // daisyUI hides a `dropdown-close` dropdown's content, and a browser won't focus a hidden element, so an option a key
  // reopens the dropdown onto is focused once the class has come off
  const reopenFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!dismissed) {
      reopenFocus.current?.focus();
      reopenFocus.current = null;
    }
  }, [dismissed]);
  // Focus moves between the button and the options while the dropdown is in use, so only entering or leaving the
  // dropdown as a whole counts as focusing or blurring the widget, which reports the current selection
  const handleBlur = useCallback(
    ({ currentTarget, relatedTarget }: FocusEvent<HTMLDivElement>) => {
      if (!currentTarget.contains(relatedTarget)) {
        setExpanded(false);
        setDismissed(false);
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

  // The keys the combobox role promises: Down and Up Arrow open the listbox and move into it, Home and End open it onto
  // its first or last option, the arrows, Home and End move between its options, and Escape closes it, returning focus
  // to the trigger. Enter and Space stay with the trigger's own press and each option's handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const { key, target } = event;
      // The options are out of the tab order, so Shift+Tab from one goes back to the trigger, which is inside the
      // dropdown and so would keep it open; it closes, as Escape does, and a second press leaves the widget. Focus is
      // moved here rather than by the browser, since `dropdown-close` hides the focused option before its default runs
      if (key === 'Tab') {
        if (event.shiftKey && listboxRef.current?.contains(target as Node)) {
          event.preventDefault();
          setDismissed(true);
          triggerRef.current?.focus();
        }
        return;
      }
      if (key === 'Escape') {
        if (expanded && !dismissed) {
          event.preventDefault();
          setDismissed(true);
          triggerRef.current?.focus();
        }
        return;
      }
      const option = listboxRef.current ? optionToFocus(listboxRef.current, target, key) : undefined;
      if (!option) {
        return;
      }
      event.preventDefault();
      if (dismissed) {
        reopenFocus.current = option;
        setDismissed(false);
      } else {
        option.focus();
      }
    },
    [expanded, dismissed],
  );

  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, isMultiple);
  const selectedIndexes = [enumOptionsIndexForValue<S>(value, optionsList, isMultiple) ?? []].flat();
  const selectedLabels = selectedIndexes.map((index) => optionsList[Number(index)].label);
  const hasValue = selectedLabels.length > 0;
  const ariaProps = widgetAriaProps(props);
  // Generated rather than built from the field's id, which no suffix keeps clear of another field's: a property named
  // `_listbox` beside a root select would share it
  const listboxId = useId();
  // A combobox takes no name from its contents, which are its value, so with no label or `aria-label` naming it, it is
  // named by the field's label, as the label drawn for it would, or, for a field with no title, such as an array item
  // or an untitled option selector, by its placeholder, else the translated prompt, as `DatePickerTrigger` is, by the rule
  // `getControlAriaLabel()` gives every theme's select. The plan points it at a label through `aria-labelledby` only where
  // `isNamedByTemplateLabel()` already reports one
  const fallbackName = getControlFallbackName<T, S, F>({ label, placeholder, registry });

  function renderOption(option: IndexedEnumOptionType<S>) {
    const isSelected = selectedIndexes.includes(String(option.index));
    // A disabled or readonly field's options can't be chosen, though they stay reachable, so its value stays readable
    const optionDisabled = disabled || readonly || option.disabled;
    const choose = (e: SyntheticEvent<HTMLLIElement>) => {
      if (optionDisabled) {
        return;
      }
      handleOptionClick(e);
      // A choice in a single select, by key or by a click, which is how VoiceOver activates an option too, closes the
      // listbox and returns focus to the combobox, which announces it, as Escape does
      if (!isMultiple) {
        setDismissed(true);
        triggerRef.current?.focus();
      }
    };
    return (
      <li
        key={option.index}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role='option'
        aria-selected={isSelected}
        aria-disabled={optionDisabled || undefined}
        data-enum-disabled={option.disabled || undefined}
        // The combobox is the widget's one tab stop, as a native select is, and the arrows move between the options
        tabIndex={-1}
        className={`px-4 py-2 ${optionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-base-200 cursor-pointer'} ${
          isSelected ? 'bg-primary/10' : ''
        }`}
        onClick={choose}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') {
            return;
          }
          // Space would scroll the listbox too
          e.preventDefault();
          if (e.key === 'Enter') {
            choose(e);
          }
        }}
        // Space chooses on its release, as it presses a button: chosen on its press, the focus it returns to the
        // combobox would take the release, which Firefox turns into a click that reopens the listbox
        onKeyUp={(e) => e.key === ' ' && choose(e)}
        data-value={option.index}
      >
        <div className='flex items-center gap-2'>
          {/* Drawn only: the option is what takes focus, keys and clicks, and says it is selected, so the checkbox would
              be a second tab stop whose own click on Space undoes the option's */}
          {isMultiple && (
            <input
              type='checkbox'
              className='checkbox checkbox-sm pointer-events-none'
              checked={isSelected}
              readOnly
              tabIndex={-1}
              aria-hidden
            />
          )}
          <span>{option.label}</span>
        </div>
      </li>
    );
  }

  return (
    <div className='form-control w-full'>
      <div className={`dropdown w-full${dismissed ? ' dropdown-close' : ''}`} onBlur={handleBlur} onFocus={handleFocus}>
        {/* A real `button` rather than the `div role='button'` daisyui's own markup uses: `label htmlFor` only
            associates with a labelable element, so on a `div` the key label and the `FieldTemplate` label both point
            at nothing. `type='button'` keeps it from submitting the form it sits in, and the explicit focus covers
            Safari and Firefox on macOS, which by platform convention do not focus a button on click — the dropdown
            opens on `:focus-within`, so without it the menu would not open for a mouse user there. Focusing without
            suppressing the default would not survive it: the default mousedown action runs after this handler, and
            it clears focus when the element it hits is not mouse-focusable, which is exactly what a button is there. */}
        <button
          id={id}
          ref={triggerRef}
          type='button'
          tabIndex={0}
          // Disabled only through `aria-disabled`, so it would still take focus and open its listbox on mount, which a
          // disabled native control can't
          autoFocus={autofocus && !disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            event.currentTarget.focus();
          }}
          onClick={() => setDismissed(false)}
          onKeyDown={handleKeyDown}
          className={`btn btn-outline w-full text-left flex justify-between items-center ${
            disabled || readonly ? 'btn-disabled' : ''
          }`}
          /* A combobox, as a native select is, so it can be `aria-invalid` while its errors show, which a button can't,
             and announces the option it displays as its value */
          role='combobox'
          aria-haspopup='listbox'
          aria-expanded={expanded && !dismissed}
          aria-controls={listboxId}
          {...ariaProps}
          aria-label={getControlAriaLabel<T, S, F>(props, ariaProps['aria-label'])}
          aria-disabled={disabled || readonly || undefined}
          // A button takes no `required`, so the combobox says it as a native select's attribute would
          aria-required={required || undefined}
        >
          {/* With no option selected and no placeholder the text is the field's label, or the translated prompt, which on
              screen stands in for a value but is no value, so it is hidden from the one the combobox holds, leaving
              that empty as a native select's empty option does */}
          <span className='truncate' aria-hidden={(!hasValue && !placeholder) || undefined}>
            {hasValue ? selectedLabels.join(', ') : placeholder || fallbackName}
          </span>
          {/* Decoration, and hidden from the value the combobox's contents give it, which would otherwise end in the
              glyph's own spoken name */}
          <span aria-hidden className='ml-2'>
            ▼
          </span>
        </button>
        <ul
          id={listboxId}
          ref={listboxRef}
          // Its options' keys bubble here, so one handler moves between them
          onKeyDown={handleKeyDown}
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
