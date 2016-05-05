import React, {PropTypes} from "react";

const REQUIRED_FIELD_SYMBOL = "*";

function TitleField(props) {
  const {id, title, required} = props;
  const legend = required ? title + REQUIRED_FIELD_SYMBOL : title;
  return <legend id={id}>{legend}</legend>;
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    required: PropTypes.bool,
  };
}

export default TitleField;
