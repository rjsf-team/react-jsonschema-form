import React, {PropTypes} from "react";

const REQUIRED_FIELD_SYMBOL = "*";

function TitleField(props) {
  const {title, required} = props;
  const legend = required ? title + REQUIRED_FIELD_SYMBOL : title;
  return <legend>{legend}</legend>;
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    title: PropTypes.string,
    required: PropTypes.bool
  };
}

export default TitleField;
