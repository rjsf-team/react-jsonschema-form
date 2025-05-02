import { ChangeEvent, FocusEvent } from 'react';
import { FormGroup, Label, TextInput } from '@trussworks/react-uswds';
import {
  ariaDescribedByIds,
  WidgetProps,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    required,
    readonly,
    disabled,
    label,
    hideLabel,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
    rawErrors = [],
  } = props;

  const inputProps = {
    id: id,
    name: id,
    placeholder: placeholder,
    autoFocus: autofocus,
    required: required,
    disabled: disabled,
    readOnly: readonly,
    className: type === 'range' || type === 'hidden' ? options.className : 'usa-input',
    list: schema.examples ? `examples_${id}` : undefined,
    value: value || value === 0 ? value : '',
    step: type === 'number' || type === 'range' ? options.step : undefined,
    min: type === 'number' || type === 'range' ? options.min : undefined,
    max: type === 'number' || type === 'range' ? options.max : undefined,
    type: type,
    onBlur: readonly ? undefined : ({ target: { value: val } }: FocusEvent<HTMLInputElement>) =>
      onBlur(id, val === '' ? options.emptyValue : val),
    onFocus: readonly ? undefined : ({ target: { value: val } }: FocusEvent<HTMLInputElement>) =>
      onFocus(id, val === '' ? options.emptyValue : val),
    onChange: readonly ? undefined : ({ target: { value: val } }: ChangeEvent<HTMLInputElement>) => {
      const newVal = val === '' ? options.emptyValue : val;
      (onChangeOverride || onChange)(newVal);
    },
    ...ariaDescribedByIds<T>(id, !!(schema.description || options.help)),
    ...(options.inputProps || {}),
  };

  const hasErrors = rawErrors.length > 0;

  return (
    <FormGroup error={hasErrors}>
      {labelValue(
        <Label htmlFor={id} error={hasErrors}>
          {label || schema.title}
          {required && <span className="usa-label--required">*</span>}
        </Label>,
        hideLabel
      )}
      <TextInput {...inputProps} />
    </FormGroup>
  );
}
