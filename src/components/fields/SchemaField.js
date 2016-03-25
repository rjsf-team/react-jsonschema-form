import React, { PropTypes } from "react";

import { isMultiSelect, retrieveSchema } from "../../utils";
import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import NumberField from "./NumberField";
import ObjectField from "./ObjectField";
import StringField from "./StringField";
import UnsupportedField from "./UnsupportedField";

const REQUIRED_FIELD_SYMBOL = "*";
const COMPONENT_TYPES = {
  "array":     ArrayField,
  "boolean":   BooleanField,
  "date-time": StringField,
  "integer":   NumberField,
  "number":    NumberField,
  "object":    ObjectField,
  "string":    StringField,
};

function getFieldComponent(schema, uiSchema, fields) {
  const field = uiSchema["ui:field"];
  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }
  return COMPONENT_TYPES[schema.type] || UnsupportedField;
}

function getLabel(label, required) {
  if (!label) {
    return null;
  }
  if (required) {
    return label + REQUIRED_FIELD_SYMBOL;
  }
  return label;
}

function ErrorList({errors}) {
  return (
    <div>
      <p/>
      <ul className="error-detail bs-callout bs-callout-info">{
        (errors || []).map((error, index) => {
          return <li className="text-danger" key={index}>{error}</li>;
        })
      }</ul>
    </div>
  );
}

function Wrapper({
    type,
    classNames,
    errorSchema,
    label,
    required,
    widget,
    displayLabel,
    children
  }) {
  const {errors} = errorSchema;
  const isError = errors && errors.length > 0;
  const classList = [
    "form-group",
    "field",
    `field-${type}`,
    isError ? "field-error has-error" : "",
    classNames,
  ].join(" ").trim();
  // XXX detect widget name?
  return (
    <div className={classList}>
      {displayLabel && label ? <label className="control-label">
                                 {getLabel(label, required)}
                               </label> : null}
      {children}
      {isError ? <ErrorList errors={errors} /> : <div/>}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  Wrapper.propTypes = {
    type: PropTypes.string.isRequired,
    classNames: React.PropTypes.string,
    label: PropTypes.string,
    required: PropTypes.bool,
    displayLabel: PropTypes.bool,
    widget: PropTypes.any, // XXX non
    children: React.PropTypes.node.isRequired,
  };
}

Wrapper.defaultProps = {
  classNames: ""
};

function SchemaField(props) {
  const {uiSchema, errorSchema, name, required, registry} = props;
  const {definitions, fields} = registry;
  const schema = retrieveSchema(props.schema, definitions);
  const FieldComponent = getFieldComponent(schema, uiSchema, fields);

  if (Object.keys(schema).length === 0) {
    return <div />;
  }

  let displayLabel = true;
  if (schema.type === "array") {
    displayLabel = isMultiSelect(schema);
  }
  if (schema.type === "object") {
    displayLabel = false;
  }

  return (
    <Wrapper
      label={schema.title || name}
      errorSchema={errorSchema}
      required={required}
      type={schema.type}
      displayLabel={displayLabel}
      classNames={uiSchema.classNames}>
      <FieldComponent {...props} />
    </Wrapper>
  );
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.func).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
    })
  };
}

export default SchemaField;
