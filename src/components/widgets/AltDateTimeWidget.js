import React, {PropTypes} from "react";


function AltDateTimeWidget(props) {
  const {AltDateWidget} = props.registry.widgets;
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
