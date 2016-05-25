import React, {PropTypes} from "react";

function DescriptionField(props) {
  const {description} = props;
  return <div className="field-description">{description}</div>;
}

if (process.env.NODE_ENV !== "production") {
  DescriptionField.propTypes = {
    id: PropTypes.string,
    description: PropTypes.string,
  };
}

export default DescriptionField;
