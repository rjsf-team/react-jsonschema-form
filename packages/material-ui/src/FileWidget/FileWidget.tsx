import React, { useState, useRef, useEffect } from "react";
import { WidgetProps } from "@visma/rjsf-core";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItem from "@material-ui/core/ListItem";
import DescriptionIcon from "@material-ui/icons/Description";

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

interface Props {
  filesInfo?: FileInfo[];
}

function dataURItoBlob(dataURI: string) {
  // Split metadata from data
  const splitted = dataURI.split(",");
  // Split params
  const params = splitted[0].split(";");
  // Get mime-type from params
  const type = params[0].replace("data:", "");
  // Filter the name property from params
  const properties = params.filter(param => {
    return param.split("=")[0] === "name";
  });
  // Look for the name and use unknown if no name property.
  let name;
  if (properties.length !== 1) {
    name = "unknown";
  } else {
    // Because we filtered out the other property,
    // we only have the name case here.
    name = properties[0].split("=")[1];
  }

  // Built the Uint8Array Blob parameter from the base64 string.
  const binary = atob(splitted[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  // Create the blob object
  const blob = new window.Blob([new Uint8Array(array)], { type });

  return { blob, name };
}

function addNameToDataURL(dataURL: any, name: any) {
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
}

function processFile(file: any) {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = event => {
      resolve({
        dataURL: addNameToDataURL(event.target!.result, name),
        name,
        size,
        type,
      });
    };
    reader.readAsDataURL(file);
  });
}

function processFiles(files: any) {
  return Promise.all([].map.call(files, processFile));
}

function extractFileInfo(dataURLs: any[]) {
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

const FilesInfo = ({ filesInfo }: Props) => {
  if (!filesInfo || filesInfo.length === 0) {
    return null;
  }
  return (
    <List id="file-info">
      {filesInfo.map((fileInfo: any, key: any) => {
        const { name, size, type } = fileInfo;
        return (
          <ListItem key={key}>
            <ListItemIcon>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText primary={name} secondary={`${type}, ${size} bytes`} />
          </ListItem>
        );
      })}
    </List>
  );
};

const FileWidget = ({
                      id,
                      options,
                      value,
                      disabled,
                      readonly,
                      multiple,
                      autofocus,
                      onChange,
                    }: WidgetProps) => {
  const [state, setState] = useState<FileInfo[]>();
  const inputRef = useRef();

  console.log('what')

  useEffect(() => {
    const values = Array.isArray(value) ? value : [value];
    const initialFilesInfo: FileInfo[] = extractFileInfo(values);
    if (initialFilesInfo.length > 0) {
      setState(initialFilesInfo);
    }
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files).then((filesInfo: any) => {
      setState(filesInfo);
      const values = filesInfo.map((fileInfo: any) => fileInfo.dataURL);
      if (multiple) {
        onChange(values);
      } else {
        onChange(values[0]);
      }
    });
  };

  return (
    <>
      <input
        ref={inputRef.current}
        id={id}
        type="file"
        disabled={readonly || disabled}
        onChange={handleChange}
        autoFocus={autofocus}
        multiple={multiple}
        accept={options.accept as string}
      />
      <FilesInfo filesInfo={state} />
    </>
  );
};

export default FileWidget;