import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { descriptionId, getTemplate, schemaRequiresTrueValue } from '@rjsf/utils';

/** The `ToggleWidget` component renders a toggle switch input with DaisyUI styling
 *
 * Features:
 * - Provides a visual toggle switch rather than a standard checkbox
 * - Supports different sizes through options (sm, md, lg)
 * - Handles required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Renders its own label after the switch, and its own description, as `CheckboxWidget` does
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ToggleWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  value,
  label,
  hideLabel,
  required,
  disabled,
  readonly,
  autofocus,
  onChange,
  onFocus,
  onBlur,
  options,
  schema,
  uiSchema,
  registry,
}: WidgetProps<T, S, F>) {
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  const description = options.description || schema.description;
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;

  /** Handle change events from the toggle input
   *
   * @param event - The change event
   */
  const handleChange = useCallback(
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked),
    [onChange],
  );

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

  // Get size from options or use default "md"
  const { size = 'md' } = options;

  // Only add size class if it's not the default size
  const sizeClass = size !== 'md' ? `toggle-${size}` : '';

  const input = (
    <input
      type='checkbox'
      id={id}
      name={htmlName || id}
      checked={value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`toggle ${sizeClass}`}
    />
  );

  return (
    <div className='form-control'>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hideLabel || !label ? (
        input
      ) : (
        <label className='cursor-pointer label my-auto justify-start'>
          <div className='mr-2'>{input}</div>
          <span className='label-text'>
            {label}
            {trueValueRequired && <span className='text-error ml-1'>*</span>}
          </span>
        </label>
      )}
    </div>
  );
}
