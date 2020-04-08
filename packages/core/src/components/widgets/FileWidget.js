import React, { Component } from "react";
import PropTypes from "prop-types";

import { dataURItoBlob, shouldRender } from "../../utils";

function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
}

const processFiles = async (filesList, maxBytes) => {
  const files = [];

  for (var i = 0; i < filesList.length; i++) {
    const file = filesList[i];
    const isFileTooLarge = file.size > maxBytes;

    // If a file is too large the browser will crash, so parse a small string instead
    const dataURL = !isFileTooLarge
      ? await processFile(file)
      : `data:text/plain;base64,${btoa(
          "File too large for parsing to base64"
        )}`;

    if (dataURL) {
      files.push({
        dataURL: addNameToDataURL(dataURL, file.name),
        name: file.name,
        size: !isFileTooLarge ? file.size : undefined,
        type: !isFileTooLarge ? file.type : undefined,
      });
    }
  }

  return files;
};

const processFile = file =>
  new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = error => {
      reject(error);
    };
    reader.onload = event => {
      resolve(event.target.result);
    };
    reader.readAsDataURL(file);
  });

function FilesInfo(props) {
  const { filesInfo } = props;
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul className="file-info">
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        return (
          <li key={key}>
            <strong>{name}</strong>{" "}
            {type && size && (
              <>
                ({type}, {size} bytes)
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function extractFileInfo(dataURLs) {
  return dataURLs
    .filter(dataURL => typeof dataURL !== "undefined")
    .map(dataURL => {
      const { blob, name } = dataURItoBlob(dataURL);
      return {
        name: name,
        size: blob.size,
        type: blob.type,
      };
    });
}
class FileWidget extends Component {
  constructor(props) {
    super(props);
    const { value } = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = { values, filesInfo: extractFileInfo(values) };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = async event => {
    const filesList = event.target.files;
    const { multiple, onChange, options } = this.props;
    const maxBytes = options && options.maxBytes ? options.maxBytes : Infinity;

    if (!filesList) {
      onChange(undefined);
      this.setState({
        values: [undefined],
        filesInfo: [],
      });
    }

    const files = await processFiles(filesList, maxBytes);

    this.setState(
      {
        values: files.map(fileInfo => fileInfo.dataURL),
        filesInfo: files,
      },
      () => {
        if (multiple) {
          onChange(this.state.values);
        } else {
          onChange(this.state.values[0]);
        }
      }
    );
  };

  render() {
    const { multiple, id, readonly, disabled, autofocus, options } = this.props;
    const { filesInfo } = this.state;
    return (
      <div>
        <p>
          <input
            ref={ref => (this.inputRef = ref)}
            id={id}
            type="file"
            disabled={readonly || disabled}
            onChange={this.onChange}
            defaultValue=""
            autoFocus={autofocus}
            multiple={multiple}
            accept={options.accept}
          />
        </p>
        <FilesInfo filesInfo={filesInfo} />
      </div>
    );
  }
}

FileWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  FileWidget.propTypes = {
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    autofocus: PropTypes.bool,
  };
}

export default FileWidget;
