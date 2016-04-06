import React, { PropTypes } from "react";

import {
  defaultFieldValue,
  getAlternativeWidget,
  optionsList,
  getDefaultRegistry
} from "../../utils";
import TextWidget from "../widgets/TextWidget";
import SelectWidget from "../widgets/SelectWidget";


function StringField(props) {
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
  const widget = uiSchema["ui:widget"] || schema.format;
  const commonProps = {
    schema,
    id: idSchema && idSchema.id,
    label: title || name,
    placeholder: description,
    onChange,
    value: defaultFieldValue(formData, schema),
    required: required,
    defaultValue: schema.default,
  };
  if (Array.isArray(schema.enum)) {
    if (widget) {
      const Widget = getAlternativeWidget(schema, widget, widgets);
      return <Widget options={optionsList(schema)} {...commonProps} />;
    }
    return <SelectWidget options={optionsList(schema)} {...commonProps} />;
  }
  if (widget) {
    const Widget = getAlternativeWidget(schema, widget, widgets);
    return <Widget {...commonProps} />;
  }
  return <TextWidget {...commonProps} />;
}

if (process.env.NODE_ENV !== "production") {
  StringField.propTypes = {
    schema: PropTypes.object.isRequired,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.func).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
    }),
    required: PropTypes.bool,
  };
}

StringField.defaultProps = {
  uiSchema: {},
  registry: getDefaultRegistry(),
};

export default StringField;
