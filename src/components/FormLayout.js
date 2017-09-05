import React from "react";

// const sampleLayoutDefs = [
//   [{ 'firstname': 7 }, { 'lastname': 5 }],
//   ['homeAddress', 'homePhone'],
//   // [
//   //   ['homeAddress', 'homePhone'],
//   //   ['workAddress', 'workPhone'],
//   // ],
// ];

export default function withLayout(Form, layoutDefs) {
  class LayoutForm extends Form {
    constructor(props) {
      super(props);
      this._originRegistry;
    }
    getRegistry() {
      this._originRegistry = super.getRegistry();
      const registry = Object.assign({}, this._originRegistry, {
        fields: Object.assign({}, this._originRegistry.fields, {
          SchemaField: this.getSchemaField(),
        }),
      });
      return registry;
    }

    getSchemaField() {
      return props => {
        return (
          <div>
            {layoutDefs.map((row, index) => (
              <div className="row" key={index}>
                {this.renderRow(row)}
              </div>
            ))}
          </div>
        );
      };
    }

    onPropertyChange = name => {
      return (value, options) => {
        const newFormData = { ...this.props.formData, [name]: value };
        this.onChange(newFormData, options);
      };
    };

    isRequired(name) {
      const schema = this.props.schema.properties[name];
      return (
        Array.isArray(schema.required) && schema.required.indexOf(name) !== -1
      );
    }
    renderField(name) {
      const SchemaField = this._originRegistry.fields.SchemaField;
      const { uiSchema, schema, errorSchema, idSchema, formData } = this.state;
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
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          registry={this._originRegistry}
        />
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
  }

  return LayoutForm;
}
