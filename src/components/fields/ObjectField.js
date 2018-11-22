import AddButton from "../AddButton";
import React, { Component } from "react";
import PropTypes from "prop-types";

import {
  orderProperties,
  retrieveSchema,
  getDefaultRegistry,
  getUiOptions,
} from "../../utils";

function DefaultObjectFieldTemplate(props) {
  const canExpand = function canExpand() {
    const { formData, schema, uiSchema } = props;
    if (!schema.additionalProperties) {
      return false;
    }
    const { expandable } = getUiOptions(uiSchema);
    if (expandable === false) {
      return expandable;
    }
    // if ui:options.expandable was not explicitly set to false, we can add
    // another property if we have not exceeded maxProperties yet
    if (schema.maxProperties !== undefined) {
      return Object.keys(formData).length < schema.maxProperties;
    }
    return true;
  };

  const { TitleField, DescriptionField } = props;
  return (
    <fieldset>
      {(props.uiSchema["ui:title"] || props.title) && (
        <TitleField
          id={`${props.idSchema.$id}__title`}
          title={props.title || props.uiSchema["ui:title"]}
          required={props.required}
          formContext={props.formContext}
        />
      )}
      {props.description && (
        <DescriptionField
          id={`${props.idSchema.$id}__description`}
          description={props.description}
          formContext={props.formContext}
        />
      )}
      {props.properties.map(prop => prop.content)}
      {canExpand() && (
        <AddButton
          className="object-property-expand"
          onClick={props.onAddClick(props.schema)}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
}

class ObjectField extends Component {
  static defaultProps = {
    uiSchema: {},
    formData: {},
    errorSchema: {},
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
  };

  state = {
    additionalProperties: {},
  };

  isRequired(name) {
    const schema = this.props.schema;
    return (
      Array.isArray(schema.required) && schema.required.indexOf(name) !== -1
    );
  }

  onPropertyChange = name => {
    return (value, errorSchema) => {
      const newFormData = { ...this.props.formData, [name]: value };
      this.props.onChange(
        newFormData,
        errorSchema &&
          this.props.errorSchema && {
            ...this.props.errorSchema,
            [name]: errorSchema,
          }
      );
    };
  };

  onDropIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { onChange, formData } = this.props;
      delete formData[index];
      onChange(formData);
    };
  };

  getAvailableKey = (preferredKey, formData) => {
    var index = 0;
    var newKey = preferredKey;
    if (!newKey && !formData.hasOwnProperty(newKey)) {
      newKey = `${preferredKey}-${++index}`;
    }
    return newKey;
  };

  onKeyChange = oldValue => {
    return (value, errorSchema) => {
      value = this.getAvailableKey(value, this.props.formData);
      const newFormData = { ...this.props.formData };
      const property = newFormData[oldValue];
      delete newFormData[oldValue];
      newFormData[value] = property;
      this.props.onChange(
        newFormData,
        errorSchema &&
          this.props.errorSchema && {
            ...this.props.errorSchema,
            [value]: errorSchema,
          }
      );
    };
  };

  getDefaultValue(type) {
    switch (type) {
      case "string":
        return "New Value";
      case "array":
        return [];
      case "boolean":
        return false;
      case "null":
        return null;
      case "number":
        return 0;
      case "object":
        return {};
      default:
        // We don't have a datatype for some reason (perhaps additionalProperties was true)
        return "New Value";
    }
  }

  handleAddClick = schema => () => {
    const type = schema.additionalProperties.type;
    const newFormData = { ...this.props.formData };
    newFormData[
      this.getAvailableKey("New Key", newFormData)
    ] = this.getDefaultValue(type);
    this.props.onChange(newFormData);
  };

  render() {
    const {
      uiSchema,
      formData,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      idPrefix,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
    } = this.props;
    const { definitions, fields, formContext } = registry;
    const { SchemaField, TitleField, DescriptionField } = fields;
    const schema = retrieveSchema(this.props.schema, definitions, formData);
    const title = schema.title === undefined ? name : schema.title;
    const description = uiSchema["ui:description"] || schema.description;
    let orderedProperties;

    try {
      const properties = Object.keys(schema.properties);
      orderedProperties = orderProperties(properties, uiSchema["ui:order"]);
    } catch (err) {
      return (
        <div>
          <p className="config-error" style={{ color: "red" }}>
            Invalid {name || "root"} object field configuration:
            <em>{err.message}</em>.
          </p>
          <pre>{JSON.stringify(schema)}</pre>
        </div>
      );
    }

    const Template = registry.ObjectFieldTemplate || DefaultObjectFieldTemplate;

    const templateProps = {
      title: uiSchema["ui:title"] || title,
      description,
      TitleField,
      DescriptionField,
      properties: orderedProperties.map(name => {
        return {
          content: (
            <SchemaField
              key={name}
              name={name}
              required={this.isRequired(name)}
              schema={schema.properties[name]}
              uiSchema={uiSchema[name]}
              errorSchema={errorSchema[name]}
              idSchema={idSchema[name]}
              idPrefix={idPrefix}
              formData={formData[name]}
              onKeyChange={this.onKeyChange(name)}
              onChange={this.onPropertyChange(name)}
              onBlur={onBlur}
              onFocus={onFocus}
              registry={registry}
              disabled={disabled}
              readonly={readonly}
              onDropIndexClick={this.onDropIndexClick}
            />
          ),
          name,
          readonly,
          disabled,
          required,
        };
      }),
      required,
      idSchema,
      uiSchema,
      schema,
      formData,
      formContext,
    };
    return <Template {...templateProps} onAddClick={this.handleAddClick} />;
  }
}

if (process.env.NODE_ENV !== "production") {
  ObjectField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.object,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired,
    }),
  };
}

export default ObjectField;
