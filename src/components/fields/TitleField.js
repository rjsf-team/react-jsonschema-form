import React, {PropTypes} from "react";

function TitleField(props) {
  return <legend>{props.title}</legend>;
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    title: PropTypes.string
  };
}

export default TitleField;
