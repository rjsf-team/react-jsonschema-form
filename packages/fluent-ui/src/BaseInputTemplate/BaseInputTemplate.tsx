import { ChangeEvent, FocusEvent } from 'react';
import { TextField } from '@fluentui/react';
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
import _pick from 'lodash/pick';

// Keys of ITextFieldProps from @fluentui/react
const allowedProps = [
  'multiline',
  'resizable',
  'autoAdjustHeight',
  'underlined',
  'borderless',
  'label',
  'onRenderLabel',
  'description',
  'onRenderDescription',
  'prefix',
  'suffix',
  'onRenderPrefix',
  'onRenderSuffix',
  'iconProps',
  'defaultValue',
  'value',
  'disabled',
  'readOnly',
  'errorMessage',
  'onChange',
  'onNotifyValidationResult',
  'onGetErrorMessage',
  'deferredValidationTime',
  'className',
  'inputClassName',
  'ariaLabel',
  'validateOnFocusIn',
  'validateOnFocusOut',
  'validateOnLoad',
  'theme',
  'styles',
  'autoComplete',
  'mask',
  'maskChar',
  'maskFormat',
  'type',
  'list',
];

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  label,
  hideLabel,
  value,
  onChange,
  onChangeOverride,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  type,
  rawErrors,
  multiline,
}: BaseInputTemplateProps<T, S, F>) {
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);

  return (
    <>
      <TextField
        id={id}
        name={id}
        placeholder={placeholder}
        label={labelValue(label, hideLabel)}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        multiline={multiline}
        // TODO: once fluent-ui supports the name prop, we can add it back in here.
        // name={name}
        {...inputProps}
        value={value || value === 0 ? value : ''}
        onChange={(onChangeOverride as any) || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        errorMessage={(rawErrors || []).join('\n')}
        list={schema.examples ? examplesId<T>(id) : undefined}
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      />
      {Array.isArray(schema.examples) && (
        <datalist id={examplesId<T>(id)}>
          {(schema.examples as string[])
            .concat(schema.default && !schema.examples.includes(schema.default) ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}
