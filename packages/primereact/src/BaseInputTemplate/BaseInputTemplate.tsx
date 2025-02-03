import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { ChangeEvent } from 'react';
import { InputText } from 'primereact/inputtext';

/** The `BaseInputTemplate` is the template the fallback if no widget is specified.
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    placeholder,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
    registry,
    rawErrors = [],
  } = props;

  const { AutoCompleteWidget } = registry.widgets;

  if (Array.isArray(schema.examples)) {
    return <AutoCompleteWidget {...props} />;
  }

  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <InputText
      id={id}
      name={id}
      placeholder={placeholder}
      {...inputProps}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      list={schema.examples ? examplesId<T>(id) : undefined}
      value={value || value === 0 ? value : ''}
      invalid={rawErrors.length > 0}
      onChange={onChangeOverride || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
    />
  );
}
