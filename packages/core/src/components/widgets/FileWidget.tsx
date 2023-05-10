import { ChangeEvent, useCallback, useState } from 'react';
import {
  dataURItoBlob,
  FormContextType,
  getTemplate,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
} from '@rjsf/utils';
import Markdown from 'markdown-to-jsx';

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

function FileInfoPreview<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  fileInfo,
  registry,
}: {
  fileInfo: FileInfoType;
  registry: Registry<T, S, F>;
}) {
  const { translateString } = registry;
  const { dataURL, type, name } = fileInfo;
  if (!dataURL) {
    return null;
  }

  if (type.indexOf('image') !== -1) {
    return <img src={dataURL} style={{ maxWidth: '100%' }} className='file-preview' />;
  }

  return (
    <>
      {' '}
      <a download={`preview-${name}`} href={dataURL} className='file-download'>
        {translateString(TranslatableString.PreviewLabel)}
      </a>
    </>
  );
}

function FilesInfo<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  filesInfo,
  registry,
  preview,
}: {
  filesInfo: FileInfoType[];
  registry: Registry<T, S, F>;
  preview?: boolean;
}) {
  if (filesInfo.length === 0) {
    return null;
  }
  const { translateString } = registry;
  return (
    <ul className='file-info'>
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        return (
          <li key={key}>
            <Markdown>{translateString(TranslatableString.FilesInfo, [name, type, String(size)])}</Markdown>
            {preview && <FileInfoPreview<T, S, F> fileInfo={fileInfo} registry={registry} />}
          </li>
        );
      })}
    </ul>
  );
}

function extractFileInfo(dataURLs: string[]): FileInfoType[] {
  return dataURLs
    .filter((dataURL) => dataURL)
    .map((dataURL) => {
      const { blob, name } = dataURItoBlob(dataURL);
      return {
        dataURL,
        name: name,
        size: blob.size,
        type: blob.type,
      };
    });
}

/**
 *  The `FileWidget` is a widget for rendering file upload fields.
 *  It is typically used with a string property with data-url format.
 */
function FileWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { disabled, readonly, required, multiple, onChange, value, options, registry } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);
  const [filesInfo, setFilesInfo] = useState<FileInfoType[]>(
    Array.isArray(value) ? extractFileInfo(value) : extractFileInfo([value])
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) {
        return;
      }
      // Due to variances in themes, dealing with multiple files for the array case now happens one file at a time.
      // This is because we don't pass `multiple` into the `BaseInputTemplate` anymore. Instead, we deal with the single
      // file in each event and concatenate them together ourselves
      processFiles(event.target.files).then((filesInfoEvent) => {
        const newValue = filesInfoEvent.map((fileInfo) => fileInfo.dataURL);
        if (multiple) {
          setFilesInfo(filesInfo.concat(filesInfoEvent[0]));
          onChange(value.concat(newValue[0]));
        } else {
          setFilesInfo(filesInfoEvent);
          onChange(newValue[0]);
        }
      });
    },
    [multiple, value, filesInfo, onChange]
  );

  return (
    <div>
      <BaseInputTemplate
        {...props}
        disabled={disabled || readonly}
        type='file'
        required={value ? false : required} // this turns off HTML required validation when a value exists
        onChangeOverride={handleChange}
        value=''
        accept={options.accept ? String(options.accept) : undefined}
      />
      <FilesInfo<T, S, F> filesInfo={filesInfo} registry={registry} preview={options.filePreview} />
    </div>
  );
}

export default FileWidget;
