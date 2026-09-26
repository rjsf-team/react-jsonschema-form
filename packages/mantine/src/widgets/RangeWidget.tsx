import { useCallback } from 'react';
import { Slider, Input, useProps } from '@mantine/core';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, getVisibleErrors, rangeSpec, titleId } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps } from '../utils.tsx';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value alongside it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
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
    options,
    onChange,
    onBlur,
    onFocus,
    schema,
  } = props;

  const themeProps = cleanupOptions(options);
  const { min, max, step } = rangeSpec(schema);
  const { description, descriptionProps } = getDescriptionProps(props);
  const { thumbProps } = useProps<GenericObjectType>('Slider', {}, { thumbProps: options.thumbProps });
  const describedBy = ariaDescribedByIds(id);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(nextValue);
      }
    },
    [onChange, disabled, readonly],
  );

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  return (
    <>
      {!hideLabel && !!label && (
        <Input.Label id={titleId(id)} required={required}>
          {label}
        </Input.Label>
      )}
      {description && <Input.Description {...descriptionProps}>{description}</Input.Description>}
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
        {...themeProps}
        thumbProps={{ ...thumbProps, 'aria-describedby': describedBy }}
      />
      {getVisibleErrors(props).map((error: string, index: number) => (
        // oxlint-disable-next-line react/no-array-index-key
        <Input.Error key={`range-widget-input-errors-${index}`}>{error}</Input.Error>
      ))}
    </>
  );
}
