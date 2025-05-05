import { useCallback } from 'react';
import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType, getTemplate, descriptionId } from '@rjsf/utils';

/** The `CheckboxWidget` component renders a single checkbox input with DaisyUI styling.
 *
 * Features:
 * - Simple boolean input with DaisyUI checkbox styling
 * - Handles required, disabled, and readonly states
 * - No label rendering (handled by the parent FieldTemplate)
 * - Proper onChange handling for boolean values
 * - Manages focus and blur events for accessibility
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    required,
    disabled,
    hideLabel,
    label,
    readonly,
    registry,
    options,
    schema,
    uiSchema,
    onChange,
    onFocus,
    onBlur,
  } = props;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  const description = options.description || schema.description;

  /** Handle focus events
   */
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  /** Handle blur events
   */
  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  /** Handle change events
   *
   * @param event - The change event
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked);
    },
    [onChange],
  );

  const input = (
    <input
      type='checkbox'
      id={id}
      checked={value}
      required={required}
      disabled={disabled || readonly}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className='checkbox'
    />
  );

  return (
    <div className='form-control'>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hideLabel || !label ? (
        input
      ) : (
        <label className='label cursor-pointer justify-start'>
          <div className='mr-2'>{input}</div>
          <span className='label-text'>
            {label}
            {required && <span className='text-error ml-1'>*</span>}
          </span>
        </label>
      )}
    </div>
  );
}
