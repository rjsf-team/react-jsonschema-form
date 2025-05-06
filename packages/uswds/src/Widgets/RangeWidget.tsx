import React, { ChangeEvent, FocusEvent } from 'react'; // Import React
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, rangeSpec } from '@rjsf/utils';
// Correctly import RangeInput from the library
import { RangeInput } from '@trussworks/react-uswds';

export default function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    label, // Get label for potential aria-labelledby
    hideLabel, // Check if label is hidden
  } = props;

  // Use rangeSpec to parse step, min, max from schema and options
  const sliderProps = { ...rangeSpec<S>(schema), ...options };

  const _onChange = ({ target: { value: eventValue } }: ChangeEvent<HTMLInputElement>) => {
    // RJSF expects numbers for range, convert empty string to undefined
    onChange(eventValue === '' ? options.emptyValue : parseFloat(eventValue));
  };
  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) => {
    onBlur(id, eventValue === '' ? options.emptyValue : parseFloat(eventValue));
  };
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) => {
    onFocus(id, eventValue === '' ? options.emptyValue : parseFloat(eventValue));
  };

  // Determine aria-label or aria-labelledby for accessibility
  const ariaLabel = hideLabel && label ? label : undefined;
  const ariaLabelledBy = !hideLabel && label ? `${id}__title` : undefined; // Assuming FieldTemplate renders label with id `${id}__title`

  return (
    <div className="field-range-wrapper">
      <RangeInput
        id={id}
        name={id}
        value={value ?? ''}
        disabled={disabled || readonly}
        onChange={!readonly ? _onChange : undefined}
        onBlur={!readonly ? _onBlur : undefined}
        onFocus={!readonly ? _onFocus : undefined}
        min={sliderProps.min}
        max={sliderProps.max}
        step={sliderProps.step}
        aria-label={ariaLabel} // Add aria-label if label is hidden
        aria-labelledby={ariaLabelledBy} // Add aria-labelledby if label is visible
      />
      <span className="range-view-value">{value}</span> {/* Display current value */}
    </div>
  );
}
