import { Component } from "react";
import {
  orderProperties,
  ADDITIONAL_PROPERTY_FLAG,
  REF_KEY,
} from "@rjsf/utils";

import * as types from "../../types";
import DefaultObjectFieldTemplate from "../templates/ObjectFieldTemplate";

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
    wasPropertyKeyModified: false,
    additionalProperties: {},
  };

  isRequired(name) {
    const schema = this.props.schema;
    return (
      Array.isArray(schema.required) && schema.required.indexOf(name) !== -1
    );
  }

  onPropertyChange = (name, addedByAdditionalProperties = false) => {
    return (value, errorSchema) => {
      if (value === undefined && addedByAdditionalProperties) {
        // Don't set value = undefined for fields added by
        // additionalProperties. Doing so removes them from the
        // formData, which causes them to completely disappear
        // (including the input field for the property name). Unlike
        // fields which are "mandated" by the schema, these fields can
        // be set to undefined by clicking a "delete field" button, so
        // set empty values to the empty string.
        value = "";
      }
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

  onDropPropertyClick = (key) => {
    return (event) => {
      event.preventDefault();
      const { onChange, formData } = this.props;
      const copiedFormData = { ...formData };
      delete copiedFormData[key];
      onChange(copiedFormData);
    };
  };

  getAvailableKey = (preferredKey, formData) => {
    var index = 0;
    var newKey = preferredKey;
    while (newKey in formData) {
      newKey = `${preferredKey}-${++index}`;
    }
    return newKey;
  };

  onKeyChange = (oldValue) => {
    return (value, errorSchema) => {
      if (oldValue === value) {
        return;
      }

      value = this.getAvailableKey(value, this.props.formData);
      const newFormData = { ...this.props.formData };
      const newKeys = { [oldValue]: value };
      const keyValues = Object.keys(newFormData).map((key) => {
        const newKey = newKeys[key] || key;
        return { [newKey]: newFormData[key] };
      });
      const renamedObj = Object.assign({}, ...keyValues);

      this.setState({ wasPropertyKeyModified: true });

      this.props.onChange(
        renamedObj,
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

  handleAddClick = (schema) => () => {
    let type = schema.additionalProperties.type;
    const newFormData = { ...this.props.formData };

    if (REF_KEY in schema.additionalProperties) {
      const { registry } = this.props;
      const { schemaUtils } = registry;
      const refSchema = schemaUtils.retrieveSchema(
        { $ref: schema.additionalProperties[REF_KEY] },
        this.props.formData
      );

      type = refSchema.type;
    }

    newFormData[this.getAvailableKey("newKey", newFormData)] =
      this.getDefaultValue(type);

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
      hideError,
      idPrefix,
      idSeparator,
      onBlur,
      onFocus,
      registry,
    } = this.props;

    const { fields, formContext, schemaUtils, templates } = registry;
    const { SchemaField } = fields;
    const schema = schemaUtils.retrieveSchema(this.props.schema, formData);

    const title = schema.title === undefined ? name : schema.title;
    const description = uiSchema["ui:description"] || schema.description;
    let orderedProperties;
    try {
      const properties = Object.keys(schema.properties || {});
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

    const Template =
      uiSchema["ui:ObjectFieldTemplate"] ||
      templates.ObjectFieldTemplate ||
      DefaultObjectFieldTemplate;

    const templateProps = {
      title: uiSchema["ui:title"] || title,
      description,
      properties: orderedProperties.map((name) => {
        const addedByAdditionalProperties =
          ADDITIONAL_PROPERTY_FLAG in schema.properties[name];
        const fieldUiSchema = addedByAdditionalProperties
          ? uiSchema.additionalProperties
          : uiSchema[name];
        const hidden = fieldUiSchema && fieldUiSchema["ui:widget"] === "hidden";

        return {
          content: (
            <SchemaField
              key={name}
              name={name}
              required={this.isRequired(name)}
              schema={schema.properties[name]}
              uiSchema={fieldUiSchema}
              errorSchema={errorSchema[name]}
              idSchema={idSchema[name]}
              idPrefix={idPrefix}
              idSeparator={idSeparator}
              formData={(formData || {})[name]}
              wasPropertyKeyModified={this.state.wasPropertyKeyModified}
              onKeyChange={this.onKeyChange(name)}
              onChange={this.onPropertyChange(
                name,
                addedByAdditionalProperties
              )}
              onBlur={onBlur}
              onFocus={onFocus}
              registry={registry}
              disabled={disabled}
              readonly={readonly}
              hideError={hideError}
              onDropPropertyClick={this.onDropPropertyClick}
            />
          ),
          name,
          readonly,
          disabled,
          required,
          hidden,
        };
      }),
      readonly,
      disabled,
      required,
      idSchema,
      uiSchema,
      schema,
      formData,
      formContext,
      registry,
    };
    return <Template {...templateProps} onAddClick={this.handleAddClick} />;
  }
}

if (process.env.NODE_ENV !== "production") {
  ObjectField.propTypes = types.fieldProps;
}

export default ObjectField;
