import React, { Component, PropTypes } from "react";

import { getDefaultFormState, orderProperties } from "../../utils";


class ObjectField extends Component {
  static defaultProps = {
    uiSchema: {}
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    return props.formData || getDefaultFormState(props.schema) || {};
  }

  isRequired(name) {
    const schema = this.props.schema;
    return Array.isArray(schema.required) &&
      schema.required.indexOf(name) !== -1;
  }

  asyncSetState(state) {
    // ensure state is propagated to parent component when it's actually set
    this.setState(state, _ => this.props.onChange(this.state));
  }

  onChange(name, value) {
    this.asyncSetState({[name]: value});
  }

  render() {
    const {schema, uiSchema, name} = this.props;
    const title = schema.title || name;
    const SchemaField = this.props.SchemaField;
    try {
      var orderedProperties = orderProperties(
        Object.keys(schema.properties), uiSchema["ui:order"]);
    } catch(err) {
      return (
        <p className="config-error" style={{color: "red"}}>
          Invalid {name || "root"} object field configuration:
          <em>{err.message}</em>.
        </p>
      );
    }
    return (
      <fieldset>
        {title ? <legend>{title}</legend> : null}
        {schema.description ?
          <div className="field-description">{schema.description}</div> : null}
        {
        orderedProperties.map((name, index) => {
          return (
            <SchemaField key={index}
              name={name}
              required={this.isRequired(name)}
              schema={schema.properties[name]}
              uiSchema={uiSchema[name]}
              formData={this.state[name]}
              onChange={this.onChange.bind(this, name)}
              SchemaField={SchemaField}/>
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
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.object,
    required: PropTypes.bool,
    SchemaField: PropTypes.func.isRequired,
  };
}

export default ObjectField;
