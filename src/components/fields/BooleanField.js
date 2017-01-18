import React, {PropTypes} from "react";

import {
  defaultFieldValue,
  getWidget,
  getUiOptions,
  optionsList,
  getDefaultRegistry
} from "../../utils";

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
    onChange,
    onBlur,
  } = props;
  const {title} = schema;
  const {widgets, formContext} = registry;
  const {widget="checkbox", ...options} = getUiOptions(uiSchema);
  const Widget = getWidget(schema, widget, widgets);
  const enumOptions = optionsList({
    enum: [true, false],
    enumNames: schema.enumNames || ["yes", "no"]
  });
  return <Widget
    options={{...options, enumOptions}}
    schema={schema}
    id={idSchema && idSchema.$id}
    onChange={onChange}
    onBlur={onBlur}
    label={title === undefined ? name : title}
    value={defaultFieldValue(formData, schema)}
    required={required}
    disabled={disabled}
    readonly={readonly}
    registry={registry}
    formContext={formContext}
    autofocus={autofocus}/>;
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
