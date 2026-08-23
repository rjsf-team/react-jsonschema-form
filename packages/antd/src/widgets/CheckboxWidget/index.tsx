import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, GenericObjectType } from '@rjsf/utils';
import { ariaDescribedByIds, schemaRequiresTrueValue } from '@rjsf/utils';
import type { CheckboxProps } from 'antd';
import { Checkbox, theme } from 'antd';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    registry,
    id,
    htmlName,
    label,
    hideLabel,
    onBlur,
    onChange,
    onFocus,
    readonly,
    value,
    required,
    schema,
  } = props;
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;
  const { token } = theme.useToken();
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;

  const handleChange: NonNullable<CheckboxProps['onChange']> = ({ target }) => onChange(target.checked);

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.checked);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.checked);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };
  return (
    <Checkbox
      autoFocus={autofocus}
      checked={typeof value === 'undefined' ? false : value}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={htmlName || id}
      required={required}
      onChange={!readonly ? handleChange : undefined}
      {...extraProps}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {!hideLabel && label ? (
        <>
          {label}
          {trueValueRequired && (
            <span aria-hidden='true' style={{ color: token.colorError, marginLeft: 2 }}>
              *
            </span>
          )}
        </>
      ) : undefined}
    </Checkbox>
  );
}
