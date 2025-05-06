import { ChangeEvent, FocusEvent } from 'react';
import {
  WidgetProps,
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Textarea, FormGroup, Label } from '@trussworks/react-uswds';

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  value,
  required,
  disabled,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options = {},
  schema,
  label,
  hideLabel,
  rawErrors = [],
  placeholder,
  autofocus,
}: WidgetProps<T, S, F>) {
  function _onChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const eventValue = event.target.value;
    onChange(eventValue === '' ? options.emptyValue : eventValue);
  }
  function _onBlur(event: FocusEvent<HTMLTextAreaElement>) {
    const eventValue = event.target.value;
    onBlur(id, eventValue === '' ? options.emptyValue : eventValue);
  }
  function _onFocus(event: FocusEvent<HTMLTextAreaElement>) {
    const eventValue = event.target.value;
    onFocus(id, eventValue === '' ? options.emptyValue : eventValue);
  }

  const inputProps = {
    placeholder: placeholder,
    autoFocus: autofocus,
  };
  const rows = typeof options.rows === 'number' ? options.rows : 5;
  const hasErrors = rawErrors.length > 0;
  const help = schema.description || options.help;

  return (
    <FormGroup error={hasErrors}>
      {labelValue(
        <Label htmlFor={id} error={hasErrors}>
          {label || schema.title}
          {required && <span className="usa-label--required">*</span>}
        </Label>,
        hideLabel,
      )}
      {help && (
        <span id={`${id}__help`} className="usa-hint">
          {help}
        </span>
      )}
      <Textarea
        id={id}
        name={id}
        value={value ? value : ''}
        disabled={disabled || readonly}
        rows={rows}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
        aria-describedby={ariaDescribedByIds<any>(id, !!help)}
        required={required}
        {...inputProps}
      />
    </FormGroup>
  );
}
