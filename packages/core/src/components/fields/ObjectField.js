import AddButton from "../AddButton";
import React, { Component } from "react";
import * as types from "../../types";

import {
  orderProperties,
  retrieveSchema,
  getDefaultRegistry,
  getUiOptions,
  ADDITIONAL_PROPERTY_FLAG,
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
    <fieldset id={props.idSchema.$id}>
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
      if (!value && addedByAdditionalProperties) {
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

  onDropPropertyClick = key => {
    return event => {
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
    while (formData.hasOwnProperty(newKey)) {
      newKey = `${preferredKey}-${++index}`;
    }
    return newKey;
  };

  onKeyChange = oldValue => {
    return (value, errorSchema) => {
      if (oldValue === value) {
        return;
      }

      value = this.getAvailableKey(value, this.props.formData);
      const newFormData = { ...this.props.formData };
      const newKeys = { [oldValue]: value };
      const keyValues = Object.keys(newFormData).map(key => {
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

  handleAddClick = schema => () => {
    let type = schema.additionalProperties.type;
    const newFormData = { ...this.props.formData };

    if (schema.additionalProperties.hasOwnProperty("$ref")) {
      const { registry = getDefaultRegistry() } = this.props;
      const refSchema = retrieveSchema(
        { $ref: schema.additionalProperties["$ref"] },
        registry.rootSchema,
        this.props.formData
      );

      type = refSchema.type;
    }

    newFormData[
      this.getAvailableKey("newKey", newFormData)
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

    const { rootSchema, fields, formContext } = registry;
    const { SchemaField, TitleField, DescriptionField } = fields;
    const schema = retrieveSchema(this.props.schema, rootSchema, formData);

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
      registry.ObjectFieldTemplate ||
      DefaultObjectFieldTemplate;

    const templateProps = {
      title: uiSchema["ui:title"] || title,
      description,
      TitleField,
      DescriptionField,
      properties: orderedProperties.map(name => {
        const addedByAdditionalProperties = schema.properties[
          name
        ].hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);
        return {
          content: (
            <SchemaField
              key={name}
              name={name}
              required={this.isRequired(name)}
              schema={schema.properties[name]}
              uiSchema={
                addedByAdditionalProperties
                  ? uiSchema.additionalProperties
                  : uiSchema[name]
              }
              errorSchema={errorSchema[name]}
              idSchema={idSchema[name]}
              idPrefix={idPrefix}
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
              onDropPropertyClick={this.onDropPropertyClick}
            />
          ),
          name,
          readonly,
          disabled,
          required,
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
    };
    return <Template {...templateProps} onAddClick={this.handleAddClick} />;
  }
}

if (process.env.NODE_ENV !== "production") {
  ObjectField.propTypes = types.fieldProps;
}

export default ObjectField;
