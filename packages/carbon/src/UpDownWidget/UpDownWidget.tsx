import { FocusEvent } from 'react';
import { NumberInput } from '@carbon/react';
import {
  ariaDescribedByIds,
  examplesId,
  FormContextType,
  getInputProps,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { LabelValue } from '../components/LabelValue';
import getCarbonOptions, { maxLgSize } from '../utils';

/** Implement `UpDownWidget`
 */
export default function UpDownWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    type,
    value,
    label,
    hideLabel,
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
  const uiOptions = getUiOptions<T, S, F>(props.uiSchema);
  const carbonOptions = getCarbonOptions<T, S, F>(props.registry.formContext, uiOptions);
  const inputProps = getInputProps<T, S, F>(schema, type, options);

  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
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
      <NumberInput
        id={id}
        name={id}
        className='form-control'
        value={typeof value === 'number' ? value : undefined}
        hideLabel
        label={<LabelValue label={label} required={required} hide={hideLabel || !label} />}
        onChange={onChangeOverride || _onChange}
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
        step={typeof inputProps.step === 'number' ? inputProps.step : undefined}
        // NumberInput doesn't support `xl` size, fallback to `lg`
        size={maxLgSize(carbonOptions.size)}
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
