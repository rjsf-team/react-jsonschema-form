import type { ReactElement, ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import { Checkbox } from '@mantine/core';
import type { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getErrorsToDraw,
  hasWidgetErrors,
  labelValue,
  schemaRequiresTrueValue,
  widgetDrawsLabel,
  templateMarksRequired,
} from '@rjsf/utils';

import { getDescriptionProps, renderErrors } from '../utils.tsx';

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
    schema,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);

  const trueValueRequired = schemaRequiresTrueValue(schema) && required;
  // The label is marked as a plan's `required` says, which takes in a box `ui:required` asks of that holds no value
  // yet, while the box is natively required only where the schema demands `true`, as RJSF's own check covers the rest
  // and `aria-required` tells a screen reader of, as the marker is hidden from it
  const marksRequired = props.presentation?.control ? required : trueValueRequired;
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

  const { description } = getDescriptionProps(props);
  const errors = getErrorsToDraw<T, S, F>(props);
  const invalid = hasWidgetErrors<T, S, F>(props);
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
              {marksRequired && templateMarksRequired<T, S, F>(props) && <span className='required'>*</span>}
            </>
          ) : (
            labelValue(label || undefined, hideLabel, false)
          )
        }
        disabled={disabled || readonly}
        required={trueValueRequired}
        aria-required={(marksRequired && !trueValueRequired) || undefined}
        autoFocus={autofocus}
        checked={Boolean(value)}
        onChange={handleCheckboxChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        // Mantine's `Checkbox` would render a message as its own error, with an id derived from the input's rather than
        // `errorId(id)`, so it only gets a boolean, for the error styling, and the errors are rendered below it. It
        // doesn't set `aria-invalid` either.
        error={invalid}
        {...getControlAttributes<T, S, F>(props)}
        aria-invalid={invalid || undefined}
      />
      {renderErrors(id, errors, { mt: 'calc(var(--mantine-spacing-xs) / 2)' })}
    </>
  );
}
