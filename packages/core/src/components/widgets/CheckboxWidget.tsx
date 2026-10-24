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
  widgetDrawsLabel,
} from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    uiSchema,
    options,
    id,
    value,
    disabled,
    readonly,
    label,
    autofocus = false,
    onBlur,
    onFocus,
    onChange,
    registry,
    htmlName,
    required,
    presentation,
  } = props;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const { classMap } = registry;
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
  const showsLabel = widgetDrawsLabel<T, S, F>(props);
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  return (
    <div className={clsx(classMap.checkboxWrapper, (disabled || readonly) && classMap.disabled)}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <label className={classMap.checkboxLabel || undefined}>
        <input
          type='checkbox'
          className={classMap.checkboxInput || undefined}
          id={id}
          name={htmlName || id}
          checked={typeof value === 'undefined' ? false : value}
          required={trueValueRequired}
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
