import { useCallback } from 'react';
import {
  ariaDescribedByIds,
  rangeSpec,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  titleId,
} from '@rjsf/utils';
import { Slider, Input } from '@mantine/core';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    name,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
    schema,
  } = props;

  const { min, max, step } = rangeSpec(schema);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(nextValue);
      }
    },
    [onChange, disabled, readonly]
  );

  const handleBlur = () => onBlur && onBlur(id, value);

  const handleFocus = () => onFocus && onFocus(id, value);

  return (
    <>
      {!hideLabel && !!label && (
        <Input.Label id={titleId<T>(id)} required={required}>
          {label}
        </Input.Label>
      )}
      {options?.description && <Input.Description>{options.description}</Input.Description>}
      <Slider
        id={id}
        name={name}
        value={value}
        max={max}
        min={min}
        step={step}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...options}
        aria-describedby={ariaDescribedByIds<T>(id)}
        classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
      />
      {rawErrors &&
        rawErrors?.length > 0 &&
        rawErrors.map((error: string, index: number) => (
          <Input.Error key={`range-widget-input-errors-${index}`}>{error}</Input.Error>
        ))}
    </>
  );
}
