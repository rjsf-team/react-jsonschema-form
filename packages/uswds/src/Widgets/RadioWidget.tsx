import { ChangeEvent, FocusEvent } from 'react'; // Added import
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  enumOptionsValueForIndex,
} from '@rjsf/utils'; // Import helper
import { Radio as UswdsRadio } from '@trussworks/react-uswds';

export default function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions = [], enumDisabled } = options;

  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(enumOptionsValueForIndex<S>(event.target.value, enumOptions));
  }
  function _onBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur(id, enumOptionsValueForIndex<S>(event.target.value, enumOptions));
  }
  function _onFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus(id, enumOptionsValueForIndex<S>(event.target.value, enumOptions));
  }

  // Determine if the whole widget is disabled or readonly
  const isDisabled = disabled || readonly;

  return (
    <div className="usa-radio-group" id={id}>
      {enumOptions.map((option, i) => {
        // Check if this specific option is disabled
        const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
        const radioId = `${id}_${i}`;

        return (
          <UswdsRadio
            key={i}
            id={radioId}
            name={id} // Use the main id for the name to group radio buttons
            value={option.value}
            checked={option.value === value}
            disabled={isDisabled || itemDisabled} // Check both widget-level and option-level disabled states
            label={option.label}
            required={required} // Apply required to each radio? USWDS might handle this at the group level. Check docs.
            onChange={!isDisabled ? _onChange : undefined} // Prevent onChange if disabled/readonly
            onBlur={!isDisabled ? _onBlur : undefined}
            onFocus={!isDisabled ? _onFocus : undefined}
          />
        );
      })}
    </div>
  );
}
