import React, {PropTypes} from "react";

import LabelText from "./LabelText";


function TitleField(props) {
  const {id, title, required} = props;
  // A root field is always required
  return (
    <legend id={id}>
      <LabelText label={title} required={required} />
    </legend>
  );
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    required: PropTypes.bool,
  };
}

export default TitleField;
