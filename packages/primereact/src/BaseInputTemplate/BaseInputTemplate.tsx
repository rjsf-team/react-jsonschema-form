import { ChangeEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { InputText } from 'primereact/inputtext';
import { ClearButton } from '../IconButton';

/** The `BaseInputTemplate` is the template the fallback if no widget is specified.
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
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

  const _onClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  const { AutoCompleteWidget } = registry.widgets;

  if (Array.isArray(schema.examples)) {
    return <AutoCompleteWidget {...props} />;
  }

  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const primeProps = (options.prime || {}) as object;
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <>
      <InputText
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        {...primeProps}
        {...inputProps}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        list={schema.examples ? examplesId(id) : undefined}
        value={value || value === 0 ? value : ''}
        invalid={rawErrors.length > 0}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={_onClear} />
      )}
    </>
  );
}
