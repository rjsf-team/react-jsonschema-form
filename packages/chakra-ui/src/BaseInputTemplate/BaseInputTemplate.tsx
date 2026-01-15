import { ChangeEvent, FocusEvent, MouseEvent, useCallback } from 'react';
import { Input } from '@chakra-ui/react';
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

import { Field } from '../components/ui/field';
import { getChakra } from '../utils';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
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
    registry,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const { ClearButton } = registry.templates.ButtonTemplates;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);
  const onClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  const chakraProps = getChakra({ uiSchema });

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
      {...chakraProps}
    >
      <Input
        id={id}
        name={htmlName || id}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        autoFocus={autofocus}
        placeholder={placeholder}
        {...inputProps}
        list={schema.examples ? examplesId(id) : undefined}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={onClear} />
      )}
      {Array.isArray(schema.examples) ? (
        <datalist id={examplesId(id)}>
          {(schema.examples as string[])
            .concat(
              schema.default !== undefined && !schema.examples.map(String).includes(String(schema.default))
                ? ([schema.default] as string[])
                : [],
            )
            .map((example: any) => {
              return <option key={String(example)} value={example} />;
            })}
        </datalist>
      ) : null}
    </Field>
  );
}
