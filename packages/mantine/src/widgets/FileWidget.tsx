import { useCallback } from 'react';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  useFileWidgetProps,
  WidgetProps,
} from '@rjsf/utils';
import { FileInput, Pill } from '@mantine/core';

import { cleanupOptions } from '../utils';

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
    (files: any) => {
      if (typeof files === 'object') {
        handleChange(files);
      }
    },
    [handleChange],
  );

  const ValueComponent = useCallback(() => {
    if (Array.isArray(filesInfo) && filesInfo.length > 0) {
      return (
        <Pill.Group>
          {filesInfo.map((file, index) => (
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
