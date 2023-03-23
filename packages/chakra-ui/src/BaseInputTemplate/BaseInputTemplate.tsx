import { ChangeEvent, FocusEvent } from 'react';
import { FormControl, FormLabel, Input } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  labelValue,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { getChakra } from '../utils';

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
    uiSchema,
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
  const chakraProps = getChakra({ uiSchema });

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      {labelValue(
        <FormLabel htmlFor={id} id={`${id}-label`}>
          {label}
        </FormLabel>,
        hideLabel || !label
      )}
      <Input
        id={id}
        name={id}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        autoFocus={autofocus}
        placeholder={placeholder}
        {...inputProps}
        list={schema.examples ? examplesId<T>(id) : undefined}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
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
    </FormControl>
  );
}
