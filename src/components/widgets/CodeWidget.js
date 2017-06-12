import React, { PropTypes } from "react";
import CodeMirror from "react-codemirror";

import "codemirror/mode/yaml/yaml";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/xml/xml";

function CodeWidget(props) {
  const { readonly, value, onChange } = props;
  const { format } = props.schema;

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      options={{
        mode: format,
        lineNumbers: true,
        readonly,
      }}
    />
  );
}
if (process.env.NODE_ENV !== "production") {
  CodeWidget.propTypes = {
    value: PropTypes.string,
    readonly: PropTypes.bool,
    schema: PropTypes.object.isRequired,
  };
}

export default CodeWidget;
