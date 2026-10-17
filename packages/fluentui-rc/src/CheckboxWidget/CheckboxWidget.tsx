import type { ChangeEvent, FocusEvent } from 'react';
import { Checkbox } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getTemplates,
  getWidgetDescription,
  labelValue,
  schemaRequiresTrueValue,
  widgetDrawsLabel,
} from '@rjsf/utils';

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
    schema,
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    registry,
    presentation,
    options,
    uiSchema,
    required,
  } = props;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const handleChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.checked);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.checked);
  const description = getWidgetDescription<T, S, F>(props);
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);

  return (
    <>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={id}
        name={htmlName || id}
        label={labelValue(label, hideLabel || !label)}
        checked={typeof value === 'undefined' ? false : Boolean(value)}
        required={trueValueRequired}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...getControlAttributes<T, S, F>({ id, presentation })}
      />
    </>
  );
}
