import React, {PropTypes} from "react";

function TitleField(props) {
  const {id, title, required} = props;
  return <legend id={id} className={required ? "legend-required":""}>{title}</legend>;
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    required: PropTypes.bool,
  };
}

export default TitleField;
