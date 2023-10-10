import { ChangeEvent, FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  FormContextType,
  getInputProps,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { TextInput } from '@carbon/react';
import { LabelValue } from '../components/LabelValue';
import getCarbonOptions from '../utils';

/** Implement `BaseInputTemplate`
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: BaseInputTemplateProps<T, S, F>) {
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
    uiSchema,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const carbonOptions = getCarbonOptions<T, S, F>(props.registry.formContext, uiOptions);

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <div>
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
      <TextInput
        id={id}
        name={id}
        className='form-control'
        value={value || value === 0 ? value : ''}
        hideLabel
        labelText={<LabelValue label={label} required={required} hide={hideLabel || !label} />}
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
        size={carbonOptions.size}
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
    </div>
  );
}
