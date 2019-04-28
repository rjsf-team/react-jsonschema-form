import React, { Component } from "react";
import PropTypes from "prop-types";

import { dataURItoBlob, shouldRender, setState } from "../../utils";

function processFile(file) {
  const { name, size, type } = file;
  return new Promise(resolve => {
    resolve({
      dataURL: `${window.URL.createObjectURL(file)}#${encodeURIComponent(
        name
      )}`,
      name,
      size,
      type,
    });
  });
}

function processFiles(files) {
  return Promise.all([].map.call(files, processFile));
}

function FilesInfo(props) {
  const { filesInfo } = props;
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul className="list-group">
      {filesInfo.map((fileInfo, key) => {
        const { dataURL, name, size, type } = fileInfo;
        return (
          <div className="media" key={key}>
            <div className="media-left">
              <object type={type} width="250" height="200" data={dataURL} />
            </div>
            <div className="media-body">
              <h4 className="media-heading">
                <strong>{name}</strong> ({type}, {size} bytes)
              </h4>
            </div>
          </div>
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

  onChange = event => {
    const { multiple, onChange } = this.props;
    processFiles(event.target.files).then(filesInfo => {
      const state = {
        values: filesInfo.map(fileInfo => fileInfo.dataURL),
        filesInfo,
      };
      setState(this, state, () => {
        if (multiple) {
          onChange(state.values);
        } else {
          onChange(state.values[0]);
        }
      });
    });
  };

  onBrowseClick = () => {
    this.inputRef.click();
  };

  render() {
    const { multiple, id, readonly, disabled, autofocus } = this.props;
    const { filesInfo } = this.state;
    return (
      <div>
        <span className="btn btn-primary" onClick={this.onBrowseClick}>
          Browse
          <input
            ref={ref => (this.inputRef = ref)}
            id={id}
            type="file"
            style={{ display: "none" }}
            disabled={readonly || disabled}
            onChange={this.onChange}
            defaultValue=""
            autoFocus={autofocus}
            multiple={multiple}
          />
        </span>
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
