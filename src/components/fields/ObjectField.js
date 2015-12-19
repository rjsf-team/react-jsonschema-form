import React, { Component } from "react";

import SchemaField from "./SchemaField";


export default class ObjectField extends Component {
  constructor(props) {
    super(props);
    this.state = props.formData || props.schema.default || {};
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
    const {schema} = this.props;
    return <fieldset>
      <legend>{schema.title || "Object"}</legend>
      {
      Object.keys(schema.properties).map((name, index) => {
        return <SchemaField key={index}
          name={name}
          required={this.isRequired(name)}
          schema={schema.properties[name]}
          formData={this.state[name]}
          onChange={this.onChange.bind(this, name)} />;
      })
    }</fieldset>;
  }
}
