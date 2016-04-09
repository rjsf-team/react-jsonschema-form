import React, { PropTypes } from "react";

import {
  defaultFieldValue,
  getAlternativeWidget,
  optionsList,
  getDefaultRegistry
} from "../../utils";
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
    registry,
    required,
    onChange
  } = props;
  const {title, description} = schema;
  const {widgets} = registry;
  const widget = uiSchema["ui:widget"];
  const commonProps = {
    schema,
    id: idSchema && idSchema.id,
    onChange,
    label: title || name,
    placeholder: description,
    value: defaultFieldValue(formData, schema),
    required,
  };
  if (widget) {
    const Widget = getAlternativeWidget(schema, widget, widgets);
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
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.func).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
    })
  };
}

BooleanField.defaultProps = {
  uiSchema: {},
  registry: getDefaultRegistry(),
};

export default BooleanField;
