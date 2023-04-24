import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  labelValue,
  schemaRequiresTrueValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

import { Checkbox, Input } from '@mantine/core';
import { ChangeEvent } from 'react';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    label = '',
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
    schema,
    uiSchema,
    rawErrors = [],
    registry,
  } = props;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);
  const _onChange = (event: ChangeEvent<HTMLInputElement>) => onChange && onChange(event.currentTarget.checked);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const checked = value == 'true' || value == true;
  const description = options.description ?? schema.description;
  const hasErrors = rawErrors.length > 0;

  return (
    <>
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={id}
        name={id}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        checked={typeof value === 'undefined' ? false : checked}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        required={required}
        label={labelValue(label, hideLabel, false)}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
      {hasErrors &&
        rawErrors.map((error, index) => (
          <Input.Error key={`checkbox-widget-input-errors-${index}`}>{error}</Input.Error>
        ))}
    </>
  );
}
