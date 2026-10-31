import { useCallback } from 'react';
import { FileInput, Pill } from '@mantine/core';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, useFileWidgetProps, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

/**
 * The `FileWidget` is a widget for rendering file upload fields.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function FileWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    options,
    multiple,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { filesInfo, handleChange, handleRemove } = useFileWidgetProps(value, onChange, multiple);
  const themeProps = cleanupOptions(options, props);

  const handleOnChange = useCallback(
    (files: File[] | File | null) => {
      // Mantine's `FileInput` hands back a `File[]` when `multiple` and a lone `File` otherwise, and `null` when cleared
      const selected = Array.isArray(files) ? files : [files].filter((file) => file !== null);
      // handleChange is async; DOM event handlers are void-returning, so we intentionally don't await
      // oxlint-disable-next-line no-void
      void handleChange(selected);
    },
    [handleChange],
  );

  // `FileInput` holds `File`s, while the form data holds data URLs. It only reads how many it holds, to choose between
  // `ValueComponent` and the placeholder and to show its clear button, so it's handed a blank `File` per stored item.
  // An item that can't be read, such as the `null` stored for a file that couldn't be or a string that isn't a data
  // URL, counts too, or the field would show no clear button for it
  const storedItems = Array.isArray(value) ? value.length : Number(Boolean(value));
  const selectedFiles = Array.from({ length: storedItems }, () => new File([], ''));

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

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  const ariaDescribedByProps = useInputAriaProps('FileInput', props);
  const error = getWidgetError<T, S, F>(props);

  return (
    <FileInput
      id={id}
      name={htmlName || id}
      value={multiple ? selectedFiles : (selectedFiles[0] ?? null)}
      placeholder={placeholder || undefined}
      accept={options.accept ? String(options.accept) : undefined}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      multiple={!!multiple}
      valueComponent={ValueComponent}
      onChange={handleOnChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={error}
      {...themeProps}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
