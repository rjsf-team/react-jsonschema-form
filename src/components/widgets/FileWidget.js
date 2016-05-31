import React, { Component, PropTypes } from "react";

import { shouldRender, setState } from "../../utils";


function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", `;name=${name};base64`);
}

function processFile(file) {
  const {name, size, type} = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = (event) => {
      resolve({
        dataURL: addNameToDataURL(event.target.result, name),
        name,
        size,
        type,
      });
    };
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
    <ul className="file-info">{
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

function dataURItoBlob(dataURI) {
  const splitted = dataURI.split(",");
  const params = splitted[0].split(";");
  const type = params[0].replace("data:", "");
  let name;
  if (!params[1]) {
    name = "unknown";
  } else {
    name = params[1].split("=")[1];
  }
  var binary = atob(splitted[1]);
  var array = [];
  for(var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  const blob = new window.Blob([new Uint8Array(array)], {type});
  blob.name = name;
  return blob;
}

function extractFileInfo(dataURLs) {
  return dataURLs
    .filter(dataURL => typeof dataURL !== "undefined")
    .map(dataURL => {
      const blob = dataURItoBlob(dataURL);
      return {
        name: blob.name,
        size: blob.size,
        type: blob.type,
      };
    });
}

class FileWidget extends Component {
  defaultProps = {
    multiple: false
  };

  constructor(props) {
    super(props);
    const {value} = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = {values, filesInfo: extractFileInfo(values)};
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (event) => {
    const {multiple, onChange} = this.props;
    processFiles(event.target.files)
      .then((filesInfo) => {
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
    const {multiple, id} = this.props;
    const {readonly, filesInfo} = this.state;
    return (
      <div>
        <p>
          <input
            id={id}
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
