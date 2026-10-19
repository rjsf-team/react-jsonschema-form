import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, hasWidgetErrors } from '@rjsf/utils';
import { FormControl, InputGroup } from 'react-bootstrap';

export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    value,
    required,
    disabled,
    autofocus,
    readonly,
    onBlur,
    onFocus,
    onChange,
    options,
    presentation,
  } = props;
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value);

  return (
    <InputGroup>
      <FormControl
        id={id}
        name={htmlName || id}
        as='textarea'
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        value={value}
        required={required}
        autoFocus={autofocus}
        rows={options.rows ?? 5}
        isInvalid={hasWidgetErrors<T, S, F>(props)}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...getControlAttributes<T, S, F>({ id, presentation })}
      />
    </InputGroup>
  );
}
