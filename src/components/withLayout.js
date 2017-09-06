import React, { Component } from "react";

export default function withLayout(Form) {
  class LayoutForm extends Form {
    constructor(props) {
      super(props);
      this.LayoutSchemaField = null;
    }
    getRegistry() {
      const originRegistry = super.getRegistry();
      const layout = this.props.uiSchema["ui:layout"];
      if (!this.LayoutSchemaField) {
        this.LayoutSchemaField = getLayoutSchemaField(originRegistry, layout);
      }
      const registry = Object.assign({}, originRegistry, {
        fields: Object.assign({}, originRegistry.fields, {
          SchemaField: this.LayoutSchemaField,
        }),
      });
      return registry;
    }
  }
  return LayoutForm;
}

function getLayoutSchemaField(originRegistry, layoutDefs) {
  const SchemaField = originRegistry.fields.SchemaField;
  return class LayoutSchemaField extends Component {
    render() {
      return (
        <div className="layout-form">
          {layoutDefs.map((row, index) => (
            <div className="row" key={index}>
              {this.renderRow(row)}
            </div>
          ))}
        </div>
      );
    }

    renderRow(layoutFields) {
      const fields = layoutFields.map(field => {
        const fieldName = Object.keys(field)[0];
        const nbCol = field[fieldName];
        return (
          <div className={`col-md-${nbCol}`} key={`lf-${fieldName}`}>
            {this.renderField(fieldName)}
          </div>
        );
      });
      return fields;
    }

    renderField(name) {
      const { uiSchema, schema, errorSchema, idSchema, formData } = this.props;
      return (
        <SchemaField
          name={name}
          required={this.isRequired(name)}
          schema={schema.properties[name]}
          uiSchema={uiSchema[name]}
          errorSchema={errorSchema[name]}
          idSchema={idSchema[name]}
          formData={formData[name]}
          onChange={this.onPropertyChange(name)}
          onBlur={this.props.onBlur}
          onFocus={this.props.onFocus}
          registry={originRegistry}
        />
      );
    }

    onPropertyChange = name => {
      return (value, options) => {
        const newFormData = { ...this.props.formData, [name]: value };
        this.props.onChange(newFormData, options);
      };
    };

    isRequired(name) {
      const schema = this.props.schema.properties[name];
      return (
        Array.isArray(schema.required) && schema.required.indexOf(name) !== -1
      );
    }
  };
}
