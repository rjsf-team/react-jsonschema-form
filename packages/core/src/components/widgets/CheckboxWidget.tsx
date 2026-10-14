import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getTemplates,
  labelValue,
  schemaRequiresTrueValue,
  getUiOptions,
  getWidgetDescription,
} from '@rjsf/utils';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  schema,
  uiSchema,
  options,
  id,
  value,
  disabled,
  readonly,
  label,
  hideLabel,
  autofocus = false,
  onBlur,
  onFocus,
  onChange,
  registry,
  htmlName,
  required,
  presentation,
}: WidgetProps<T, S, F>) {
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const trueValueRequired = schemaRequiresTrueValue<S>(schema) && required;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked),
    [onChange],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onBlur(id, event.target.checked),
    [onBlur, id],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onFocus(id, event.target.checked),
    [onFocus, id],
  );

  // The plan says whether the label and description are this widget's to draw, so a checkbox under a label above names
  // none of its own; without a plan, a template rendering the `checkbox` alias draws the description itself
  const showsLabel = presentation ? presentation.label.by === 'self' : !hideLabel;
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox'
      ? getWidgetDescription<T, S, F>({ id, options, schema, hideLabel, presentation })
      : undefined;
  return (
    <div className={`checkbox ${disabled || readonly ? 'disabled' : ''}`}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <label>
        <input
          type='checkbox'
          id={id}
          name={htmlName || id}
          checked={typeof value === 'undefined' ? false : value}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...getControlAttributes<T, S, F>({ id, presentation })}
        />
        {labelValue(
          <span>
            {label}
            {trueValueRequired && <span className='required'>*</span>}
          </span>,
          !showsLabel,
        )}
      </label>
    </div>
  );
}

export default CheckboxWidget;
