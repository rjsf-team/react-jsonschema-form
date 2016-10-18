import React, { PropTypes } from "react";

import {
  defaultFieldValue,
  getAlternativeWidget,
  optionsList,
  getDefaultRegistry,
  isObject,
} from "../../utils";
import CheckboxWidget from "./../widgets/CheckboxWidget";


function buildOptions(schema, uiSchema={}) {
  return {
    inline: isObject(uiSchema) &&
            isObject(uiSchema.options) &&
            uiSchema.options.inline,
    enumOptions: optionsList(Object.assign({
      enumNames: ["true", "false"],
      enum: [true, false]
    }, {enumNames: schema.enumNames}))
  };
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
    disabled,
    readonly,
    autofocus,
    onChange
  } = props;
  const {title} = schema;
  const {widgets, formContext} = registry;
  const widget = uiSchema["ui:widget"];
  const commonProps = {
    schema,
    id: idSchema && idSchema.$id,
    onChange,
    label: (title === undefined) ? name : title,
    value: defaultFieldValue(formData, schema),
    required,
    disabled,
    readonly,
    registry,
    formContext,
    autofocus,
  };
  if (widget) {
    const Widget = getAlternativeWidget(schema, widget, widgets);
    return <Widget options={buildOptions(schema, uiSchema["ui:widget"])} {...commonProps} />;
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
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
      ])).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired,
    })
  };
}

BooleanField.defaultProps = {
  uiSchema: {},
  registry: getDefaultRegistry(),
  disabled: false,
  readonly: false,
  autofocus: false,
};

export default BooleanField;
