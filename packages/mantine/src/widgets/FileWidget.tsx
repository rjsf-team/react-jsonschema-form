import { useCallback } from 'react';
import { FileInput, Pill } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue, useFileWidgetProps } from '@rjsf/utils';

import { cleanupOptions } from '../utils.ts';

/**
 * The `FileWidget` is a widget for rendering file upload fields.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function FileWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    name,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    options,
    multiple,
    onChange,
  } = props;
  const { filesInfo, handleChange, handleRemove } = useFileWidgetProps(value, onChange, multiple);
  const themeProps = cleanupOptions(options);

  const handleOnChange = useCallback(
    (files: File[] | File | null) => {
      // Mantine's `FileInput` hands back a `File[]` when `multiple` and a single `File` otherwise; its clear button
      // sends `[]` or `null`, which must reach the form as an empty value rather than be dropped or concatenated
      if (files === null || (Array.isArray(files) && files.length === 0)) {
        onChange(multiple ? [] : undefined);
        return;
      }
      // handleChange is async; DOM event handlers are void-returning, so we intentionally don't await
      // oxlint-disable-next-line no-floating-promises, no-void
      void handleChange(Array.isArray(files) ? files : [files]);
    },
    [handleChange, multiple, onChange],
  );

  const ValueComponent = useCallback(() => {
    if (Array.isArray(filesInfo) && filesInfo.length > 0) {
      return (
        <Pill.Group>
          {filesInfo.map((file, index) => (
            // oxlint-disable-next-line react/no-array-index-key
            <Pill key={index} withRemoveButton onRemove={() => handleRemove(index)}>
              {file.name}
            </Pill>
          ))}
        </Pill.Group>
      );
    }
    return null;
  }, [handleRemove, filesInfo]);

  return (
    <FileInput
      id={id}
      name={name}
      value={value || ''}
      placeholder={placeholder || undefined}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      multiple={!!multiple}
      valueComponent={ValueComponent}
      onChange={handleOnChange}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      {...themeProps}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
