import React, { PropTypes } from "react";

import { defaultFieldValue, getAlternativeWidget, optionsList } from "../../utils";
import TextWidget from "./../widgets/TextWidget";
import SelectWidget from "./../widgets/SelectWidget";


function StringField(props) {
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
    label: title || name,
    placeholder: description,
    onChange,
    value: defaultFieldValue(formData, schema),
    required: required,
    defaultValue: schema.default,
  };
  if (Array.isArray(schema.enum)) {
    if (widget) {
      const Widget = getAlternativeWidget(schema.type, widget, widgets);
      return <Widget options={optionsList(schema)} {...commonProps} />;
    }
    return <SelectWidget options={optionsList(schema)} {...commonProps} />;
  }
  if (widget) {
    const Widget = getAlternativeWidget(schema.type, widget, widgets);
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
    required: PropTypes.bool,
  };
}

StringField.defaultProps = {
  uiSchema: {}
};

export default StringField;
