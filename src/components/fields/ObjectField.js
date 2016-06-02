import React, { Component, PropTypes } from "react";

import {
  getDefaultFormState,
  getAlternativeWidget,
  orderProperties,
  retrieveSchema,
  shouldRender,
  getDefaultRegistry,
  setState
} from "../../utils";


class ObjectField extends Component {
  static defaultProps = {
    uiSchema: {},
    errorSchema: {},
    idSchema: {},
    registry: getDefaultRegistry(),
    required: false,
    disabled: false,
    readonly: false,
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const {schema, formData, registry} = props;
    return getDefaultFormState(schema, formData, registry.definitions) || {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  isRequired(name) {
    const schema = this.props.schema;
    return Array.isArray(schema.required) &&
      schema.required.indexOf(name) !== -1;
  }

  asyncSetState(state, options={validate: false}) {
    setState(this, state, () => {
      this.props.onChange(this.state, options);
    });
  }

  onPropertyChange = (name) => {
    return (value, options) => {
      this.asyncSetState({[name]: value}, options);
    };
  };

  onObjectChange = (value) => {
    this.asyncSetState(value);
  };

  render() {
    const {
      uiSchema,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly
    } = this.props;
    const {definitions, fields, widgets} = this.props.registry;
    const {SchemaField, TitleField, DescriptionField} = fields;
    const schema = retrieveSchema(this.props.schema, definitions);
    const title = schema.title || name;
    const {description} = schema;
    const widget = uiSchema['ui:widget'] || schema.format;
    let orderedProperties;
    try {
      const properties = Object.keys(schema.properties);
      orderedProperties = orderProperties(properties, uiSchema["ui:order"]);
    } catch(err) {
      return (
        <div>
          <p className="config-error" style={{color: "red"}}>
            Invalid {name || "root"} object field configuration:
            <em>{err.message}</em>.
          </p>
          <pre>{JSON.stringify(schema)}</pre>
        </div>
      );
    }
    if(widget) {
      const Widget = getAlternativeWidget(schema, widget, widgets);
      return <Widget
          id={idSchema && idSchema.id}
          label={title}
          placeholder={description}
          onChange={this.onObjectChange}
          schema={schema}
          value={this.state}
          required={required}
        />;
    }
    return (
      <fieldset>
        {title ? <TitleField
                   id={`${idSchema.id}__title`}
                   title={title}
                   required={required} /> : null}
        {schema.description ?
          <DescriptionField
            id={`${idSchema.id}__description`}
            description={schema.description}
          /> : null}
        {
        orderedProperties.map((name, index) => {
          return (
            <SchemaField key={index}
              name={name}
              required={this.isRequired(name)}
              schema={schema.properties[name]}
              uiSchema={uiSchema[name]}
              errorSchema={errorSchema[name]}
              idSchema={idSchema[name]}
              formData={this.state[name]}
              onChange={this.onPropertyChange(name)}
              registry={this.props.registry}
              disabled={disabled}
              readonly={readonly} />
          );
        })
      }</fieldset>
    );
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
      widgets: PropTypes.objectOf(PropTypes.func).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
    })
  };
}

export default ObjectField;
