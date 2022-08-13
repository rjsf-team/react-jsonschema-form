import { ChangeEvent, Component } from "react";

import { dataURItoBlob, shouldRender, WidgetProps } from "@rjsf/utils";

function addNameToDataURL(dataURL: string, name: string) {
  if (dataURL === null) {
    return null;
  }
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
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
      if (typeof event.target?.result === "string") {
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

function FilesInfo({
  filesInfo,
}: {
  filesInfo: { name: string; size: number; type: string }[];
}) {
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul className="file-info">
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        return (
          <li key={key}>
            <strong>{name}</strong> ({type}, {size} bytes)
          </li>
        );
      })}
    </ul>
  );
}

function extractFileInfo(dataURLs: string[]) {
  return dataURLs
    .filter((dataURL) => typeof dataURL !== "undefined")
    .map((dataURL) => {
      const { blob, name } = dataURItoBlob(dataURL);
      return {
        name: name,
        size: blob.size,
        type: blob.type,
      };
    });
}

type FileWidgetStateType = {
  values: any[];
  filesInfo: FileInfoType[];
};

/**
 *  The `FileWidget` is a widget for rendering file upload fields.
 *  It is typically used with a string property with data-url format.
 */
class FileWidget<T, F> extends Component<
  WidgetProps<T, F>,
  FileWidgetStateType
> {
  constructor(props: WidgetProps<T, F>) {
    super(props);
    const { value } = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = { values, filesInfo: extractFileInfo(values) };
  }

  shouldComponentUpdate(
    nextProps: WidgetProps<T, F>,
    nextState: FileWidgetStateType
  ): boolean {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { multiple, onChange } = this.props;
    if (!event.target.files) {
      return;
    }
    processFiles(event.target.files).then((filesInfo) => {
      const state = {
        values: filesInfo.map((fileInfo) => fileInfo.dataURL),
        filesInfo,
      };
      this.setState(state, () => {
        if (multiple) {
          onChange(state.values);
        } else {
          onChange(state.values[0]);
        }
      });
    });
  };

  render() {
    const {
      multiple,
      id,
      readonly,
      disabled,
      autofocus = false,
      options,
    } = this.props;
    const { filesInfo } = this.state;
    return (
      <div>
        <p>
          <input
            id={id}
            type="file"
            disabled={readonly || disabled}
            onChange={this.onChange}
            defaultValue=""
            autoFocus={autofocus}
            multiple={multiple}
            accept={options.accept ? String(options.accept) : undefined}
          />
        </p>
        <FilesInfo filesInfo={filesInfo} />
      </div>
    );
  }
}

export default FileWidget;
