import { FocusEvent } from 'react';
import { Checkbox } from 'antd';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  optionId,
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
  GenericObjectType,
} from '@rjsf/utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  autofocus,
  disabled,
  registry,
  id,
  htmlName,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  value,
}: WidgetProps<T, S, F>) {
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleChange = (nextValue: any) =>
    onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target.value, enumOptions, optionValueFormat, emptyValue));

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target.value, enumOptions, optionValueFormat, emptyValue));

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    id,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };

  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, true, optionValueFormat, []) as string[];

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <>
      <Checkbox.Group
        disabled={disabled || (readonlyAsDisabled && readonly)}
        name={htmlName || id}
        onChange={!readonly ? handleChange : undefined}
        value={selectValue}
        {...extraProps}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, i) => (
            <span key={i}>
              <Checkbox
                id={optionId(id, i)}
                name={htmlName || id}
                autoFocus={i === 0 ? autofocus : false}
                disabled={Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1}
                value={enumOptionValueEncoder(option.value, i, optionValueFormat)}
              >
                {option.label}
              </Checkbox>
              {!inline && <br />}
            </span>
          ))}
      </Checkbox.Group>
    </>
  ) : null;
}
