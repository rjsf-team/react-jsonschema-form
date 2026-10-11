import type { ReactElement, ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import { Checkbox, Input } from '@mantine/core';
import type { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, errorId, labelValue, schemaRequiresTrueValue } from '@rjsf/utils';

import { useDescriptionProps, useVisibleErrors } from '../utils.tsx';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): ReactElement {
  const {
    id,
    htmlName,
    value = false,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    schema,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const trueValueRequired = schemaRequiresTrueValue(schema) && required;
  const handleCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!disabled && !readonly && onChange) {
        onChange(e.currentTarget.checked);
      }
    },
    [onChange, disabled, readonly],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, target.checked);
      }
    },
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, target.checked);
      }
    },
    [onFocus, id],
  );

  const { description } = useDescriptionProps(props);
  const errors = useVisibleErrors(props);
  return (
    <>
      {description}
      <Checkbox
        id={id}
        name={htmlName || id}
        label={
          !hideLabel && label ? (
            <>
              {label}
              {trueValueRequired && <span className='required'>*</span>}
            </>
          ) : (
            labelValue(label || undefined, hideLabel, false)
          )
        }
        disabled={disabled || readonly}
        required={trueValueRequired}
        autoFocus={autofocus}
        checked={typeof value === 'undefined' ? false : value === 'true' || value}
        onChange={handleCheckboxChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        // Mantine's `Checkbox` would render a message as its own error, with an id derived from the input's rather than
        // `errorId(id)`, so it only gets a boolean, for the error styling, and the errors are rendered below it. It
        // doesn't set `aria-invalid` either.
        error={!!errors}
        aria-invalid={!!errors || undefined}
        aria-describedby={ariaDescribedByIds(id)}
      />
      {errors && (
        <Input.Error id={errorId(id)} mt='calc(var(--mantine-spacing-xs) / 2)'>
          {errors}
        </Input.Error>
      )}
    </>
  );
}
