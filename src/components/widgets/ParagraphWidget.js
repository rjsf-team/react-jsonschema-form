import React, { PropTypes } from "react";


function ParagraphWidget({placeholder}) {
  return (<p>{placeholder}</p>);
}
if (process.env.NODE_ENV !== "production") {
  ParagraphWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
  };
}

ParagraphWidget.displayLabel = false;

export default ParagraphWidget;
