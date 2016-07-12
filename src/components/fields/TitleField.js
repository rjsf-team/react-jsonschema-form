import React, {PropTypes} from "react";

import LabelText from "./LabelText";


function TitleField({id, title, required, root}) {
  return (
    <legend id={id}>
      <LabelText label={title} required={root || required} />
    </legend>
  );
}

TitleField.defaultProps = {
  root: false,
  required: false,
};

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    root: PropTypes.bool.isRequired,
    required: PropTypes.bool.isRequired,
    id: PropTypes.string,
    title: PropTypes.string,
  };
}

export default TitleField;
