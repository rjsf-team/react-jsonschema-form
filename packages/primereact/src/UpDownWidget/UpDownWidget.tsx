import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, getInputProps } from '@rjsf/utils';
import type { InputNumberChangeEvent } from 'primereact/inputnumber';
import { InputNumber } from 'primereact/inputnumber';

/** The `UpDownWidget` renders an input component for a number.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function UpDownWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
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
  const primeProps = (options.prime || {}) as object;

  const handleChange = (event: InputNumberChangeEvent) => onChange(event.value === null ? options.emptyValue : value);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);

  return (
    <InputNumber
      id={id}
      name={id}
      {...primeProps}
      placeholder={placeholder}
      step={Number.isNaN(Number(inputProps.step)) ? 1 : Number(inputProps.step)}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      style={buttonLayout === 'vertical' ? { width: '4em' } : {}}
      showButtons={typeof showButtons === 'undefined' ? true : !!showButtons}
      buttonLayout={buttonLayout ?? 'stacked'}
      useGrouping={!!useGrouping}
      minFractionDigits={minFractionDigits as number}
      maxFractionDigits={maxFractionDigits as number}
      locale={locale as string}
      mode={currency ? 'currency' : 'decimal'}
      currency={currency as string}
      value={Number.isNaN(Number(value)) ? null : Number(value)}
      invalid={rawErrors.length > 0}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
    />
  );
}
