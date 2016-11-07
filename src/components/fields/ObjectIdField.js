import React, {PropTypes} from "react";

function ObjectIdField(props) {
  const {StringField} = props.registry.fields;
  const {formData} = props;
  const formDataStr = formData && (formData._str || formData.toString());
  return (
    <StringField {...props} formData={formDataStr} />
  );
}

if (process.env.NODE_ENV !== "production") {
  ObjectIdField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.object,
    required: PropTypes.bool,
    formContext: PropTypes.object.isRequired,
  };
}

ObjectIdField.defaultProps = {
  uiSchema: {}
};

export default ObjectIdField;
