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


const REQUIRED_FIELD_SYMBOL = "*";
const COMPONENT_TYPES = {
  array:   ArrayField,
  boolean: BooleanField,
  integer: NumberField,
  number:  NumberField,
  object:  ObjectField,
  string:  StringField,
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

function Label(props) {
  const {label, required, id} = props;
  if (!label) {
    return null;
  }
  return (
    <label className="control-label" htmlFor={id}>
      {required ? label + REQUIRED_FIELD_SYMBOL : label}
    </label>
  );
}

function Help(props) {
  const {help} = props;
  if (!help) {
    return null;
  }
  if (typeof help === "string") {
    return <p className="help-block">{help}</p>;
  }
  return <div className="help-block">{help}</div>;
}

function ErrorList(props) {
  const {errors = []} = props;
  if (errors.length === 0) {
    return null;
  }
  return (
    <div>
      <p/>
      <ul className="error-detail bs-callout bs-callout-info">{
        errors.map((error, index) => {
          return <li className="text-danger" key={index}>{error}</li>;
        })
      }</ul>
    </div>
  );
}

function DefaultTemplate(props) {
  const {
    id,
    classNames,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return children;
  }
  return (
    <div className={classNames}>
      {displayLabel ? <Label label={label} required={required} id={id} /> : null}
      {displayLabel && description ? description : null}
      {children}
      {errors}
      {help}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: PropTypes.string,
    classNames: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
    errors: PropTypes.element,
    help: PropTypes.element,
    description: PropTypes.element,
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    displayLabel: PropTypes.bool,
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

function SchemaField(props) {
  const {uiSchema, errorSchema, idSchema, name, required, registry} = props;
  const {definitions, fields, FieldTemplate = DefaultTemplate} = registry;
  const schema = retrieveSchema(props.schema, definitions);
  const FieldComponent = getFieldComponent(schema, uiSchema, fields);
  const {DescriptionField} = fields;
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

  const field = (
    <FieldComponent {...props}
      schema={schema}
      disabled={disabled}
      readonly={readonly} />
  );

  const {type} = schema;
  const id = idSchema.$id;
  const label = props.schema.title || schema.title || name;
  const description = props.schema.description || schema.description;
  const errors = errorSchema.__errors;
  const help = uiSchema["ui:help"];
  const hidden = uiSchema["ui:widget"] === "hidden";
  const classNames = [
    "form-group",
    "field",
    `field-${type}`,
    errors && errors.length > 0 ? "field-error has-error" : "",
    uiSchema.classNames,
  ].join(" ").trim();

  const fieldProps = {
    description: <DescriptionField id={id + "__description"} description={description} />,
    help: <Help help={help} />,
    errors: <ErrorList errors={errors} />,
    id,
    label,
    hidden,
    required,
    readonly,
    displayLabel,
    classNames,
    context
  };

  return <FieldTemplate {...fieldProps}>{field}</FieldTemplate>;
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  registry: getDefaultRegistry(),
  context: {},
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
      context: PropTypes.object,
      FieldTemplate: PropTypes.func,
    })
  };
}

export default SchemaField;
