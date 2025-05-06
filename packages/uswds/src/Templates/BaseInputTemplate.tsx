import {
  BaseInputTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ariaDescribedByIds,
} from '@rjsf/utils';
import { TextInput } from '@trussworks/react-uswds';
import React from 'react';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    value,
    type,
    placeholder,
    required,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    rawErrors = [],
    autofocus,
    registry,
    ...rest
  } = props;

  const _onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    onChange(target.value === '' ? options.emptyValue : target.value);
  };
  const _onBlur = ({ target }: React.FocusEvent<HTMLInputElement>) => {
    onBlur(id, target.value === '' ? options.emptyValue : target.value);
  };
  const _onFocus = ({ target }: React.FocusEvent<HTMLInputElement>) => {
    onFocus(id, target.value === '' ? options.emptyValue : target.value);
  };

  const hasErrors = rawErrors.length > 0;

  const inputProps: React.ComponentProps<typeof TextInput> = {
    id: id,
    name: id,
    type: type === 'string' ? 'text' : type,
    value: value ?? '',
    placeholder: placeholder,
    required: required,
    disabled: disabled || readonly,
    autoFocus: autofocus,
    'aria-invalid': hasErrors ? true : undefined,
    'aria-describedby': ariaDescribedByIds(id, hasErrors),
    step: options.step || rest.step,
    min: options.min || rest.min,
    max: options.max || rest.max,
    list: schema.examples ? `${id}__examples` : undefined,
  };

  const examples = schema.examples as string[] | undefined;
  const defaultExample = schema.default !== undefined ? String(schema.default) : undefined;

  return (
    <>
      <TextInput {...inputProps} onChange={_onChange} onBlur={_onBlur} onFocus={_onFocus} />
      {examples && (
        <datalist id={`${id}__examples`}>
          {examples
            .concat(defaultExample && !examples.includes(defaultExample) ? [defaultExample] : [])
            .map((example: string) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}
