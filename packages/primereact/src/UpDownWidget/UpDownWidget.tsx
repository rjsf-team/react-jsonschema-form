import {
  ariaDescribedByIds,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { InputNumber, InputNumberChangeEvent } from 'primereact/inputnumber';

export default function UpDownWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
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
    rawErrors = [],
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const { showButtons, buttonLayout, useGrouping, minFractionDigits, maxFractionDigits, locale, currency } = options;
  const _onChange = (event: InputNumberChangeEvent) => onChange(event.value === null ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <InputNumber
      id={id}
      name={id}
      placeholder={placeholder}
      step={isNaN(Number(inputProps.step)) ? 1 : Number(inputProps.step)}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      style={buttonLayout === 'vertical' ? { width: '4em' } : {}}
      showButtons={typeof showButtons === 'undefined' ? true : !!showButtons}
      buttonLayout={(buttonLayout as any) ?? 'stacked'}
      useGrouping={!!useGrouping}
      minFractionDigits={minFractionDigits as number}
      maxFractionDigits={maxFractionDigits as number}
      locale={locale as string}
      mode={currency ? 'currency' : 'decimal'}
      currency={currency as string}
      value={isNaN(Number(value)) ? null : Number(value)}
      invalid={rawErrors.length > 0}
      onChange={(onChangeOverride as any) || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
    />
  );
}
