import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, schemaRequiresTrueValue, widgetDrawsLabel } from '@rjsf/utils';
import type { CheckboxProps } from 'antd';
import { Checkbox, theme } from 'antd';

import useControlState from '../../controlState.ts';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    registry,
    id,
    htmlName,
    label,
    onBlur,
    onChange,
    onFocus,
    readonly,
    value,
    required,
    schema,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { token } = theme.useToken();
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;
  const control = useControlState<T, S, F>({ disabled, readonly, required: trueValueRequired, registry });

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
      disabled={control.disabled}
      id={id}
      name={htmlName || id}
      required={control.toggleRequired}
      aria-readonly={control.ariaReadonly}
      onChange={!readonly ? handleChange : undefined}
      {...extraProps}
      {...getControlAttributes<T, S, F>({ id, presentation })}
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
