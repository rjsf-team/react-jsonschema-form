import React, { PropTypes } from "react";

import {
  defaultFieldValue,
  optionsList,
  getDefaultRegistry,
  getSchemaTypeWithoutNull,
} from "../../utils";

import RadioWidget from "../widgets/RadioWidget";

const RADIO_TEXT_NOT_NULL = "On";
const RADIO_TEXT_NULL = "Off";

const COMPONENT_TYPES_DEFAULTS = {
  array:   [],
  boolean: false,
  integer: 0,
  number:  0,
  object:  {},
  string:  ""
};


function buildOptions() {
  return {
    enumOptions: optionsList({
      enumNames: [RADIO_TEXT_NOT_NULL, RADIO_TEXT_NULL],
      enum: [false, true]
    })
  };
}

function NullableField(props) {
  const {
      schema,
      idSchema,
      formData,
      registry,
      required,
      disabled,
      readonly,
      onChange
  } = props;
  const {formContext} = registry;
  const commonProps = {
    schema,
    id: ( idSchema && idSchema.$id )+ "nullable",
    required,
    disabled,
    readonly,
    registry,
    formContext,
  };
  const value = defaultFieldValue(formData, schema);
  const isNull = value == null;
  const optionStyle = {
    groupStyle: {
      position: "absolute",
      top: 0,
      right: 0,
    },
    inputStyle: {
      margin: 5
    }
  };
  return <RadioWidget optionClassName="" optionStyle={optionStyle} value={isNull} options={buildOptions()} {...commonProps} onChange={(eventIsNull, event) => {
      const schemaType = getSchemaTypeWithoutNull(schema);
      const newValue = eventIsNull == false ? COMPONENT_TYPES_DEFAULTS[schemaType] : null;
      onChange(newValue);
    }
  } />;
}

if (process.env.NODE_ENV !== "production") {
  NullableField.propTypes = {
    schema: PropTypes.object.isRequired,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.array,
      React.PropTypes.bool,
      React.PropTypes.object
    ]),
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
      ])).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired,
    }),
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
  };
}

NullableField.defaultProps = {
  registry: getDefaultRegistry(),
  disabled: false,
  readonly: false,
};

export default class Nullable extends React.Component {
  render() {
    const { children, formData, ...nullProps } = this.props;
    return (
      <div>
        <NullableField formData={formData} {...nullProps} />
        {
          formData == null
          ? null
          : <span>{children}</span>
        }
      </div>
    )
  }
}