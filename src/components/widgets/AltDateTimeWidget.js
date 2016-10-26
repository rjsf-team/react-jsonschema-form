import React, {PropTypes} from "react";

import AltDateWidget from "./AltDateWidget";


function AltDateTimeWidget(props) {
  return <AltDateWidget time {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  AltDateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default AltDateTimeWidget;
