import React, { Component, PropTypes } from "react";

import { shouldRender, setState } from "../../utils";


function processFile(file) {
  const {name, size, type} = file;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve({
      dataURL: event.target.result,
      name,
      size,
      type,
    });
    reader.readAsDataURL(file);
  });
}

function processFiles(files) {
  return Promise.all([].map.call(files, processFile));
}

function FilesInfo(props) {
  const {filesInfo} = props;
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul>{
      filesInfo.map((fileInfo, key) => {
        const {name, size, type} = fileInfo;
        return (
          <li key={key}>
            <strong>{name}</strong> ({type}, {size} bytes)
          </li>
        );
      })
    }</ul>
  );
}

class FileWidget extends Component {
  defaultProps = {
    multiple: false
  };

  constructor(props) {
    super(props);
    const {value} = props;
    this.state = {
      values: Array.isArray(value) ? value : [value],
      filesInfo: []
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (event) => {
    const {multiple, onChange} = this.props;
    processFiles(event.target.files).then((filesInfo) => {
      const state = {
        values: filesInfo.map(fileInfo => fileInfo.dataURL),
        filesInfo
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

  render() {
    const {multiple} = this.props;
    const {readonly, filesInfo} = this.state;
    return (
      <div>
        <p>
          <input
            type="file"
            readOnly={readonly}
            onChange={this.onChange}
            defaultValue=""
            multiple={multiple} />
        </p>
        <FilesInfo filesInfo={filesInfo} />
      </div>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  FileWidget.propTypes = {
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ])
  };
}

export default FileWidget;
