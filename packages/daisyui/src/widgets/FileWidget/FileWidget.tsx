import { ChangeEvent, FocusEvent, useCallback } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `FileWidget` component provides a file input with DaisyUI styling
 *
 * Features:
 * - Handles both single and multiple file uploads
 * - Supports file type filtering via accept attribute
 * - Properly manages disabled and readonly states
 * - Handles focus and blur events
 *
 * @param props - The `WidgetProps` for this component
 */
export default function FileWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, required, disabled, readonly, schema, onChange, onFocus, onBlur, options = {} } = props;

  // Ensure isMulti is explicitly a boolean.
  const isMulti: boolean = schema.type === 'array' || Boolean(options.multiple);

  // Accept attribute for restricting file types (e.g., "image/*"), if defined in options.
  const accept: string | undefined = typeof options.accept === 'string' ? options.accept : undefined;

  /** Handle file selection changes
   *
   * @param event - The change event from the file input
   */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) {
        return;
      }
      // Convert FileList to array for multiple upload handling.
      const fileList = Array.from(event.target.files);
      if (isMulti) {
        onChange(fileList);
      } else {
        // For single file, send the first file (or null if none chosen)
        onChange(fileList[0] || null);
      }
    },
    [onChange, isMulti],
  );

  /** Handle focus events
   *
   * @param event - The focus event
   */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, event.target.files ? Array.from(event.target.files) : null);
      }
    },
    [onFocus, id],
  );

  /** Handle blur events
   *
   * @param event - The blur event
   */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, event.target.files ? Array.from(event.target.files) : null);
      }
    },
    [onBlur, id],
  );

  return (
    <input
      id={id}
      type='file'
      className='file-input w-full'
      required={required}
      disabled={disabled || readonly}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiple={isMulti}
      accept={accept}
    />
  );
}
