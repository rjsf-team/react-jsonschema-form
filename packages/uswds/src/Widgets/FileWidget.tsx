import { ChangeEvent, useCallback, useMemo } from 'react'; // Import hooks
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  dataURItoBlob, // Import helpers
  getTemplate,
  Registry,
  TranslatableString,
  // UIOptionsType, // Remove or comment out the unused declaration
} from '@rjsf/utils';
import Markdown from 'markdown-to-jsx'; // Import Markdown for FilesInfo
import { Button } from '@trussworks/react-uswds'; // Import Button for remove

// Helper functions copied/adapted from core FileWidget
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

function processFiles(files: FileList): Promise<FileInfoType[]> {
  return Promise.all(Array.from(files).map(processFile));
}

// Simple FilesInfo display component adapted for USWDS
function FilesInfo<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  filesInfo,
  registry,
  onRemove,
}: {
  filesInfo: FileInfoType[];
  registry: Registry<T, S, F>;
  onRemove: (index: number) => void;
}) {
  if (filesInfo.length === 0) {
    return null;
  }
  const { translateString } = registry;
  // Use USWDS Button for removal
  // const { RemoveButton } = getTemplate<'ButtonTemplates', T, S, F>('ButtonTemplates', registry, options); // Or use direct Button

  return (
    <ul className="usa-list usa-list--unstyled margin-top-1">
      {' '}
      {/* USWDS list styling */}
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        const handleRemove = () => onRemove(key);
        return (
          <li key={key} className="margin-bottom-1">
            <Markdown>
              {translateString(TranslatableString.FilesInfo, [name, type, String(size)])}
            </Markdown>
            {/* Add preview if needed */}
            {/* {options.filePreview && <FileInfoPreview fileInfo={fileInfo} registry={registry} />} */}
            <Button
              type="button"
              onClick={handleRemove}
              unstyled // Use unstyled for simple remove link/button
              className="margin-left-1 text-error" // Basic styling
            >
              {translateString(TranslatableString.RemoveButton)}
            </Button>
          </li>
        );
      })}
    </ul>
  );
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

// Updated FileWidget implementation
export default function FileWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    disabled,
    readonly,
    required,
    multiple,
    onChange,
    value,
    registry,
    options: fileOptions,
  } = props;
  // Get BaseInputTemplate from registry
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>(
    'BaseInputTemplate',
    registry,
    fileOptions,
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) {
        return;
      }
      processFiles(event.target.files).then((filesInfoEvent) => {
        const newValue = filesInfoEvent.map((fileInfo) => fileInfo.dataURL);
        if (multiple) {
          // Ensure value is treated as an array
          const currentValue = Array.isArray(value) ? value : [];
          onChange(currentValue.concat(newValue.filter((v) => v !== null) as string[]));
        } else {
          onChange(newValue[0]);
        }
      });
    },
    [multiple, value, onChange],
  );

  // Ensure value is always an array for extractFileInfo, handle single value case
  const valueArray = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const filesInfo = useMemo(() => extractFileInfo(valueArray), [valueArray]);

  const rmFile = useCallback(
    (index: number) => {
      if (multiple) {
        // Ensure value is treated as an array
        const currentValue = Array.isArray(value) ? value : [];
        const newValue = currentValue.filter((_: any, i: number) => i !== index);
        onChange(newValue);
      } else {
        onChange(undefined);
      }
    },
    [multiple, value, onChange],
  );

  // Determine if the input should be considered 'filled' (for required validation)
  const hasValue = multiple ? value && value.length > 0 : !!value;

  return (
    <div>
      <BaseInputTemplate
        {...props}
        disabled={disabled || readonly}
        type="file"
        required={!hasValue && required} // Turn off HTML required validation only if a value exists
        onChangeOverride={handleChange} // Use onChangeOverride for BaseInputTemplate
        value="" // Input value is always empty for file inputs
        accept={fileOptions.accept ? String(fileOptions.accept) : undefined}
        multiple={multiple} // Pass multiple to BaseInputTemplate if needed by underlying input
      />
      <FilesInfo<T, S, F>
        filesInfo={filesInfo}
        onRemove={rmFile}
        registry={registry}
        // preview={fileOptions.filePreview} // Enable preview if desired
      />
    </div>
  );
}
