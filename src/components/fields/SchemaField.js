import React, { PropTypes } from "react";

import {
  isMultiSelect,
  retrieveSchema,
  getDefaultRegistry,
  isFilesArray
} from "../../utils";
import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import NumberField from "./NumberField";
import ObjectField from "./ObjectField";
import StringField from "./StringField";
import UnsupportedField from "./UnsupportedField";
import DescriptionField from "./DescriptionField";
import LabelText from "./LabelText";


const COMPONENT_TYPES = {
  "array":     ArrayField,
  "boolean":   BooleanField,
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

function getLabel(label, required, id) {
  if (!label) {
    return null;
  }
  return (
    <label className="control-label" htmlFor={id}>
      <LabelText label={label} required={required} />
    </label>
  );
}

function renderHelp(help) {
  if (!help) {
    return null;
  }
  if (typeof help === "string") {
    return <p className="help-block">{help}</p>;
  }
  return <div className="help-block">{help}</div>;
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
    description,
    hidden,
    help,
    required,
    displayLabel,
    id,
    children,
  }) {
  if (hidden) {
    return children;
  }
  const errors = errorSchema.__errors;
  const isError = errors && errors.length > 0;
  const classList = [
    "form-group",
    "field",
    `field-${type}`,
    isError ? "field-error has-error" : "",
    classNames,
  ].join(" ").trim();
  return (
    <div className={classList}>
      {displayLabel && label ? getLabel(label, required, id) : null}
      {displayLabel && description ?
        <DescriptionField id={`${id}__description`} description={description} /> : null}
      {children}
      {isError ? <ErrorList errors={errors} /> : <div/>}
      {renderHelp(help)}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  Wrapper.propTypes = {
    type: PropTypes.string.isRequired,
    id: PropTypes.string,
    classNames: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
    ]),
    help: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
    ]),
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    displayLabel: PropTypes.bool,
    children: PropTypes.node.isRequired,
  };
}

Wrapper.defaultProps = {
  classNames: "",
  errorSchema: {errors: []},
  hidden: false,
  required: false,
  displayLabel: true,
};

function SchemaField(props) {
  const {uiSchema, errorSchema, idSchema, name, required, registry} = props;
  const {definitions, fields} = registry;
  const schema = retrieveSchema(props.schema, definitions);
  const FieldComponent = getFieldComponent(schema, uiSchema, fields);
  const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  const readonly = Boolean(props.readonly || uiSchema["ui:readonly"]);

  if (Object.keys(schema).length === 0) {
    return <div />;
  }

  let displayLabel = true;
  if (schema.type === "array") {
    displayLabel = isMultiSelect(schema) || isFilesArray(schema, uiSchema);
  }
  if (schema.type === "object") {
    displayLabel = false;
  }
  if (schema.type === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }
  if (uiSchema["ui:field"]) {
    displayLabel = false;
  }

  return (
    <Wrapper
      label={props.schema.title || schema.title || name}
      description={props.schema.description || schema.description}
      errorSchema={errorSchema}
      hidden={uiSchema["ui:widget"] === "hidden"}
      help={uiSchema["ui:help"]}
      required={required}
      type={schema.type}
      displayLabel={displayLabel}
      id={idSchema.$id}
      classNames={uiSchema.classNames}>
      <FieldComponent {...props}
        schema={schema}
        disabled={disabled}
        readonly={readonly} />
    </Wrapper>
  );
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  registry: getDefaultRegistry(),
  disabled: false,
  readonly: false,
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
      ])).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
    })
  };
}

export default SchemaField;
