import { useCallback } from 'react';
import {
  dataURItoBlob,
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { FileInput, Pill } from '@mantine/core';
import { cleanupOptions } from '../utils';

function addNameToDataURL(dataURL: string, name: string) {
  if (dataURL === null) {
    return null;
  }
  return dataURL.replace(';base64', `;name=${encodeURIComponent(name)};base64`);
}

type FileInfoType = {
  dataURL?: string | null;
  name: string;
  size: number;
  type: string;
};

function processFile(file: File): Promise<FileInfoType> {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        resolve({
          dataURL: addNameToDataURL(event.target.result, name),
          name,
          size,
          type,
        });
      } else {
        resolve({
          dataURL: null,
          name,
          size,
          type,
        });
      }
    };
    reader.readAsDataURL(file);
  });
}

function processFiles(files: FileList) {
  return Promise.all(Array.from(files).map(processFile));
}

function extractFileInfo(dataURLs: string[]): FileInfoType[] {
  return dataURLs.reduce((acc, dataURL) => {
    if (!dataURL) {
      return acc;
    }
    try {
      const { blob, name } = dataURItoBlob(dataURL);
      return [
        ...acc,
        {
          dataURL,
          name: name,
          size: blob.size,
          type: blob.type,
        },
      ];
    } catch (e) {
      // Invalid dataURI, so just ignore it.
      return acc;
    }
  }, [] as FileInfoType[]);
}

/**
 * The `FileWidget` is a widget for rendering file upload fields.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function FileWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
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

  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (files: any) => {
      if (typeof files === 'object') {
        processFiles(multiple ? files : [files]).then((filesInfoEvent) => {
          const newValue = filesInfoEvent.map((fileInfo) => fileInfo.dataURL);
          if (multiple) {
            onChange(value.concat(newValue));
          } else {
            onChange(newValue[0]);
          }
        });
      }
      return;
    },
    [multiple, value, onChange]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (multiple) {
        const newValue = value.filter((_: any, i: number) => i !== index);
        onChange(newValue);
      } else {
        onChange(undefined);
      }
    },
    [multiple, value, onChange]
  );

  const ValueComponent = useCallback(
    (props: any) => {
      const filesInfo = props.value ? extractFileInfo(Array.isArray(props.value) ? props.value : [props.value]) : null;
      if (Array.isArray(filesInfo) && filesInfo.length > 0) {
        return (
          <Pill.Group>
            {filesInfo.map((file, index) => (
              <Pill key={index} withRemoveButton onRemove={() => handleRemoveFile(index)}>
                {file.name}
              </Pill>
            ))}
          </Pill.Group>
        );
      }
      return null;
    },
    [handleRemoveFile]
  );

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
      onChange={handleChange}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      {...themeProps}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
