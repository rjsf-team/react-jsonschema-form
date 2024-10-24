import { ChangeEvent, useCallback, useMemo } from 'react';
import {
  dataURItoBlob,
  FormContextType,
  getTemplate,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  UIOptionsType,
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

  // If type is JPEG or PNG then show image preview.
  // Originally, any type of image was supported, but this was changed into a whitelist
  // since SVGs and animated GIFs are also images, which are generally considered a security risk.
  if (['image/jpeg', 'image/png'].includes(type)) {
    return <img src={dataURL} style={{ maxWidth: '100%' }} className='file-preview' />;
  }

  // otherwise, let users download file

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
  onRemove,
  options,
}: {
  filesInfo: FileInfoType[];
  registry: Registry<T, S, F>;
  preview?: boolean;
  onRemove: (index: number) => void;
  options: UIOptionsType<T, S, F>;
}) {
  if (filesInfo.length === 0) {
    return null;
  }
  const { translateString } = registry;

  const { RemoveButton } = getTemplate<'ButtonTemplates', T, S, F>('ButtonTemplates', registry, options);

  return (
    <ul className='file-info'>
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        const handleRemove = () => onRemove(key);
        return (
          <li key={key}>
            <Markdown>{translateString(TranslatableString.FilesInfo, [name, type, String(size)])}</Markdown>
            {preview && <FileInfoPreview<T, S, F> fileInfo={fileInfo} registry={registry} />}
            <RemoveButton onClick={handleRemove} registry={registry} />
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

/**
 *  The `FileWidget` is a widget for rendering file upload fields.
 *  It is typically used with a string property with data-url format.
 */
function FileWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { disabled, readonly, required, multiple, onChange, value, options, registry } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);

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
          onChange(value.concat(newValue));
        } else {
          onChange(newValue[0]);
        }
      });
    },
    [multiple, value, onChange]
  );

  const filesInfo = useMemo(() => extractFileInfo(Array.isArray(value) ? value : [value]), [value]);
  const rmFile = useCallback(
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
      <FilesInfo<T, S, F>
        filesInfo={filesInfo}
        onRemove={rmFile}
        registry={registry}
        preview={options.filePreview}
        options={options}
      />
    </div>
  );
}

export default FileWidget;
