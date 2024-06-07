import { FocusEvent } from 'react';
import { Slider } from '@carbon/react';
import {
  ariaDescribedByIds,
  examplesId,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

/** Implement `RangeWidget`
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    type,
    value,
    schema,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
    required,
    readonly,
    rawErrors,
    autofocus,
    placeholder,
    disabled,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);

  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = (data: { value: string }) => onBlur(id, data.value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <>
      <style>
        {`
          .form-control .cds--text-input__field-wrapper[data-invalid]~.cds--form-requirement {
            display: none;
          }

          .form-control .cds--text-area__label-wrapper {
            display: none;
          }
        `}
      </style>
      <Slider
        id={id}
        name={id}
        className='form-control'
        value={typeof value === 'number' ? value : Number(value)}
        onChange={(data: { value: number }) => (onChangeOverride || _onChange)?.(data.value)}
        onBlur={_onBlur}
        onFocus={_onFocus}
        autoFocus={autofocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled || readonly}
        invalid={rawErrors && rawErrors.length > 0}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
        list={schema.examples ? examplesId<T>(id) : undefined}
        {...inputProps}
        min={inputProps.min ?? 0}
        max={inputProps.max ?? 100}
        step={typeof inputProps.step === 'number' ? inputProps.step : undefined}
      />
      {Array.isArray(schema.examples) ? (
        <datalist id={examplesId<T>(id)}>
          {(schema.examples as string[])
            .concat(schema.default && !schema.examples.includes(schema.default) ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      ) : null}
    </>
  );
}
