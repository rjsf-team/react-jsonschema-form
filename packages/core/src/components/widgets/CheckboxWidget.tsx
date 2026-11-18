import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  fieldShowsOwnErrors,
  getControlAttributes,
  getTemplates,
  labelValue,
  getCheckboxRequired,
  getUiOptions,
  getWidgetDescription,
  joinClassNames,
  widgetDrawsLabelText,
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
    presentation,
  } = props;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const { classMap } = registry;
  // The field's own error state, as its wrapper has it, rather than its control's, which is invalid while a field above
  // shows its errors even where this one hides them
  const hasErrors = fieldShowsOwnErrors<T, S, F>(props);
  const { trueValueRequired, marksRequired } = getCheckboxRequired<T, S, F>(props);

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
  const showsLabel = widgetDrawsLabelText<T, S, F>(props);
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  return (
    <div
      className={joinClassNames('rjsf-checkbox', classMap.checkboxWrapper, (disabled || readonly) && classMap.disabled)}
      data-disabled={disabled || readonly || undefined}
    >
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          hasErrors={hasErrors}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <label className={classMap.checkboxLabel} data-invalid={hasErrors || undefined}>
        <input
          type='checkbox'
          className={classMap.checkboxInput}
          id={id}
          name={htmlName || id}
          checked={Boolean(value)}
          required={trueValueRequired}
          aria-required={(marksRequired && !trueValueRequired) || undefined}
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
            {marksRequired && <span className='rjsf-required'>*</span>}
          </span>,
          !showsLabel,
        )}
      </label>
    </div>
  );
}

export default CheckboxWidget;
