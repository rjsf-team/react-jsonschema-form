import { ChangeEvent, FocusEvent } from 'react'; // Added import
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Label } from '@trussworks/react-uswds'; // Import Label if needed for accessibility

// USWDS doesn't have a specific DateTime picker, use styled native input
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  value,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  required,
  label,
}: WidgetProps<T, S, F>) {
  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value || undefined);
  }
  function _onBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur(id, event.target.value);
  }
  function _onFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus(id, event.target.value);
  }

  // Format value for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatValue = (val: any) => {
    if (!val) {
      return '';
    }
    try {
      const date = new Date(val);
      // Basic formatting, might need more robust handling
      return date.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  return (
    <>
      {/* Optional: Add Label for better accessibility if not handled by FieldTemplate */}
      {/* <Label htmlFor={id}>{label || schema.title}</Label> */}
      <input
        type="datetime-local"
        id={id}
        name={id}
        className="usa-input" // Apply USWDS input styling
        value={formatValue(value)}
        required={required}
        disabled={disabled || readonly}
        onChange={!readonly ? _onChange : undefined}
        onBlur={!readonly ? _onBlur : undefined}
        onFocus={!readonly ? _onFocus : undefined}
      />
    </>
  );
}
