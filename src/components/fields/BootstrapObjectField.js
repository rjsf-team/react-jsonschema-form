import React, { Component } from "react";
import PropTypes from "prop-types";

import {
  orderProperties,
  retrieveSchema,
  getDefaultRegistry,
} from "../../utils";

class BootstrapObjectField extends Component {
  static defaultProps = {
    uiSchema: {},
    formData: {},
    errorSchema: {},
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
  };

  isRequired(name) {
    const schema = this.props.schema;
    return (
      Array.isArray(schema.required) && schema.required.indexOf(name) !== -1
    );
  }

  onPropertyChange = name => {
    return (value, options) => {
      const newFormData = { ...this.props.formData, [name]: value };
      this.props.onChange(newFormData, options);
    };
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
      onBlur,
      registry = getDefaultRegistry(),
    } = this.props;
    const { definitions, fields, formContext } = registry;
    const { SchemaField, TitleField, DescriptionField } = fields;
    const schema = retrieveSchema(this.props.schema, definitions);
    const title = schema.title === undefined ? name : schema.title;
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
    return (
      <fieldset>
        {title &&
          <TitleField
            id={`${idSchema.$id}__title`}
            title={title}
            required={required}
            formContext={formContext}
          />}
        {schema.description &&
          <DescriptionField
            id={`${idSchema.$id}__description`}
            description={schema.description}
            formContext={formContext}
          />}
        <div className="row">
          {orderedProperties.map((name, index) => {
            if (!uiSchema[name]) {
              uiSchema[name] = {};
            }
            if (!/col\-xs\-.*/.test(uiSchema[name]["classNames"])) {
              uiSchema[name]["classNames"] =
                (uiSchema[name]["classNames"] || "") + " col-xs-12";
            }
            return (
              <SchemaField
                key={index}
                name={name}
                required={this.isRequired(name)}
                schema={schema.properties[name]}
                uiSchema={uiSchema[name]}
                errorSchema={errorSchema[name]}
                idSchema={idSchema[name]}
                formData={formData[name]}
                onChange={this.onPropertyChange(name)}
                onBlur={onBlur}
                registry={registry}
                disabled={disabled}
                readonly={readonly}
              />
            );
          })}
        </div>
      </fieldset>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  BootstrapObjectField.propTypes = {
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

export default BootstrapObjectField;
