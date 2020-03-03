import React, { Component } from "react";
import PropTypes from "prop-types";

import { dataURItoBlob, shouldRender } from "../../utils";

const mbInBytes = 1000000;

function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
}

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
            <strong>{name}</strong> ({type}, {size} bytes)
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

const toBase64 = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

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
    const { multiple, onChange } = this.props;

    if (!filesList) {
      onChange(undefined);
      this.setState({
        values: [undefined],
        filesInfo: [],
      });
    }

    const files = [];

    for (var i = 0; i < filesList.length; i++) {
      const file = filesList[i];

      // If a file is too large the browser will crash, so parse a small string instead
      const dataURL =
        file.size < mbInBytes
          ? await toBase64(file)
          : `data:text/plain;base64,${btoa(
              "File too large for parsing to base64"
            )}`;

      files.push({
        dataURL: addNameToDataURL(dataURL, file.name),
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

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
