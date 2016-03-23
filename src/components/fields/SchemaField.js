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
    return <span>{label + REQUIRED_FIELD_SYMBOL}</span>;
  }
  return <span>{label}</span>;
}

function getContent({type, label, required, children, displayLabel}) {
  if (!displayLabel) {
    return children;
  }

  return (
    <label>
      {getLabel(label, required)}
      {children}
    </label>
  );
}

function ErrorList({errors}) {
  return (
    <div className="error-detail">{
      (errors || []).map((error, index) => {
        return <li key={index}>{error}</li>;
      })
    }</div>
  );
}

function Wrapper(props) {
  const {type, classNames, errorSchema} = props;
  const {errors} = errorSchema;
  const isError = errors && errors.length > 0;
  const classList = [
    "field",
    `field-${type}`,
    isError ? "field-error" : "",
    classNames,
  ].join(" ").trim();
  return (
    <div className={classList}>
      {getContent(props)}
      {isError ? <ErrorList errors={errors} /> : <div/>}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  Wrapper.propTypes = {
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    required: PropTypes.bool,
    displayLabel: PropTypes.bool,
    children: React.PropTypes.node.isRequired,
    classNames: React.PropTypes.string,
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
