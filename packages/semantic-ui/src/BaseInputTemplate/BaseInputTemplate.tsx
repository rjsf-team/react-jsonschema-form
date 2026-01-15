import { ChangeEvent, MouseEvent, useCallback } from 'react';
import { Form } from 'semantic-ui-react';
import { getSemanticProps } from '../util';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  getInputProps,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
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
    label,
    hideLabel,
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
    uiSchema,
    registry,
    type,
    rawErrors = [],
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const semanticProps = getSemanticProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options,
  });
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const _onClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  return (
    <>
      <Form.Input
        key={id}
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        {...inputProps}
        label={labelValue(label || undefined, hideLabel, false)}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        list={schema.examples ? examplesId(id) : undefined}
        {...semanticProps}
        value={value || value === 0 ? value : ''}
        error={rawErrors.length > 0}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={_onClear} />
      )}
      {Array.isArray(schema.examples) && (
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
      )}
    </>
  );
}
