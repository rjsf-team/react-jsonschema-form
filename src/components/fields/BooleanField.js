import React, { PropTypes } from "react";

import { defaultFieldValue, getAlternativeWidget, optionsList } from "../../utils";
import CheckboxWidget from "./../widgets/CheckboxWidget";


function buildOptions(schema) {
  return optionsList(Object.assign({
    enumNames: ["true", "false"],
    enum: [true, false]
  }, {enumNames: schema.enumNames}));
}

function BooleanField(props) {
  const {
    schema,
    name,
    uiSchema,
    idSchema,
    formData,
    widgets,
    required,
    onChange
  } = props;
  const {title, description} = schema;
  const widget = uiSchema["ui:widget"];
  const commonProps = {
    schema,
    id: idSchema && idSchema.id,
    onChange,
    label: title || name,
    placeholder: description,
    defaultValue: schema.default,
    value: defaultFieldValue(formData, schema),
    required,
  };
  if (widget) {
    const Widget = getAlternativeWidget(schema.type, widget, widgets);
    return <Widget options={buildOptions(schema)} {... commonProps} />;
  }
  return <CheckboxWidget {...commonProps} />;
}

if (process.env.NODE_ENV !== "production") {
  BooleanField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.bool,
    required: PropTypes.bool,
  };
}

BooleanField.defaultProps = {
  uiSchema: {}
};

export default BooleanField;
