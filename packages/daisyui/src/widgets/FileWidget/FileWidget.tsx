import React from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

const FileWidget = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) => {
  const { id, required, disabled, readonly, schema, onChange, options = {} } = props;

  // Ensure isMulti is explicitly a boolean.
  const isMulti: boolean = schema.type === 'array' || Boolean(options.multiple);

  // Accept attribute for restricting file types (e.g., "image/*"), if defined in options.
  const accept: string | undefined = typeof options.accept === 'string' ? options.accept : undefined;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  return (
    <input
      id={id}
      type='file'
      className='file-input'
      required={required}
      disabled={disabled || readonly}
      onChange={handleChange}
      multiple={isMulti}
      accept={accept}
    />
  );
};

export default FileWidget;
