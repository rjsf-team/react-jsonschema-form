import { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { mergeObjects, deepEquals, getSchemaType } from "@rjsf/utils";

import * as types from "../../types";
import DefaultFieldTemplate from "../templates/FieldTemplate";

const COMPONENT_TYPES = {
  array: "ArrayField",
  boolean: "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  null: "NullField",
};

function getFieldComponent(schema, uiSchema, idSchema, fields) {
  const field = uiSchema["ui:field"];
  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }

  const componentName = COMPONENT_TYPES[getSchemaType(schema)];

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  return componentName in fields
    ? fields[componentName]
    : () => {
        const { UnsupportedField } = fields;

        return (
          <UnsupportedField
            schema={schema}
            idSchema={idSchema}
            reason={`Unknown field type ${schema.type}`}
          />
        );
      };
}

function Help(props) {
  const { id, help } = props;
  if (!help) {
    return null;
  }
  if (typeof help === "string") {
    return (
      <p id={id} className="help-block">
        {help}
      </p>
    );
  }
  return (
    <div id={id} className="help-block">
      {help}
    </div>
  );
}

function ErrorList(props) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return null;
  }

  return (
    <div>
      <ul className="error-detail bs-callout bs-callout-info">
        {errors
          .filter((elem) => !!elem)
          .map((error, index) => {
            return (
              <li className="text-danger" key={index}>
                {error}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function SchemaFieldRender(props) {
  const {
    uiSchema,
    formData,
    errorSchema,
    idPrefix,
    idSeparator,
    name,
    onChange,
    onKeyChange,
    onDropPropertyClick,
    required,
    registry,
    wasPropertyKeyModified = false,
  } = props;
  const { fields, formContext, schemaUtils, templates } = registry;
  const FieldTemplate =
    uiSchema["ui:FieldTemplate"] ||
    templates.FieldTemplate ||
    DefaultFieldTemplate;
  let idSchema = props.idSchema;
  const schema = schemaUtils.retrieveSchema(props.schema, formData);
  idSchema = mergeObjects(
    schemaUtils.toIdSchema(schema, null, formData, idPrefix, idSeparator),
    idSchema
  );
  const FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
  const { DescriptionFieldTemplate } = templates;
  const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  const readonly = Boolean(
    props.readonly ||
      uiSchema["ui:readonly"] ||
      props.schema.readOnly ||
      schema.readOnly
  );
  const uiSchemaHideError = uiSchema["ui:hideError"];
  // Set hideError to the value provided in the uiSchema, otherwise stick with the prop to propagate to children
  const hideError =
    uiSchemaHideError === undefined
      ? props.hideError
      : Boolean(uiSchemaHideError);
  const autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);

  const { __errors, ...fieldErrorSchema } = errorSchema;

  // See #439: uiSchema: Don't pass consumed class names to child components
  const field = (
    <FieldComponent
      {...props}
      idSchema={idSchema}
      schema={schema}
      uiSchema={{ ...uiSchema, classNames: undefined }}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema}
      formContext={formContext}
      rawErrors={__errors}
    />
  );

  const id = idSchema.$id;

  // If this schema has a title defined, but the user has set a new key/label, retain their input.
  let label;
  if (wasPropertyKeyModified) {
    label = name;
  } else {
    label = uiSchema["ui:title"] || props.schema.title || schema.title || name;
  }

  const description =
    uiSchema["ui:description"] ||
    props.schema.description ||
    schema.description;
  const errors = __errors;
  const help = uiSchema["ui:help"];
  const hidden = uiSchema["ui:widget"] === "hidden";

  let classNames = ["form-group", "field", `field-${schema.type}`];
  if (!hideError && errors && errors.length > 0) {
    classNames.push("field-error has-error has-danger");
  }
  classNames.push(uiSchema.classNames);
  classNames = classNames.join(" ").trim();

  const fieldProps = {
    description: (
      <DescriptionFieldTemplate
        id={id + "__description"}
        description={description}
        registry={registry}
      />
    ),
    rawDescription: description,
    help: <Help id={id + "__help"} help={help} />,
    rawHelp: typeof help === "string" ? help : undefined,
    errors: hideError ? undefined : <ErrorList errors={errors} />,
    rawErrors: hideError ? undefined : errors,
    id,
    label,
    hidden,
    onChange,
    onKeyChange,
    onDropPropertyClick,
    required,
    disabled,
    readonly,
    hideError,
    displayLabel,
    classNames,
    formContext,
    formData,
    fields,
    schema,
    uiSchema,
    registry,
  };

  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;

  return (
    <FieldTemplate {...fieldProps}>
      <Fragment>
        {field}

        {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
        {schema.anyOf && !schemaUtils.isSelect(schema) && (
          <_AnyOfField
            disabled={disabled}
            readonly={readonly}
            hideError={hideError}
            errorSchema={errorSchema}
            formData={formData}
            idPrefix={idPrefix}
            idSchema={idSchema}
            idSeparator={idSeparator}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.anyOf.map((_schema) =>
              schemaUtils.retrieveSchema(_schema, formData)
            )}
            baseType={schema.type}
            registry={registry}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}

        {schema.oneOf && !schemaUtils.isSelect(schema) && (
          <_OneOfField
            disabled={disabled}
            readonly={readonly}
            hideError={hideError}
            errorSchema={errorSchema}
            formData={formData}
            idPrefix={idPrefix}
            idSchema={idSchema}
            idSeparator={idSeparator}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.oneOf.map((_schema) =>
              schemaUtils.retrieveSchema(_schema, formData)
            )}
            baseType={schema.type}
            registry={registry}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}
      </Fragment>
    </FieldTemplate>
  );
}

class SchemaField extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !deepEquals(this.props, nextProps);
  }

  render() {
    return SchemaFieldRender(this.props);
  }
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false,
  hideError: false,
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: types.registry.isRequired,
  };
}

export default SchemaField;
