import React, { Component, PropTypes } from "react";

import { getDefaultFormState } from "../../utils";
import SchemaField from "./SchemaField";


class ObjectField extends Component {
  static defaultProps = {
    uiSchema: {}
  }

  constructor(props) {
    super(props);
    this.state = props.formData || getDefaultFormState(props.schema) || {};
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
    const {schema, uiSchema} = this.props;
    return (
      <fieldset>
        <legend>{schema.title || "Object"}</legend>
        {
        Object.keys(schema.properties).map((name, index) => {
          return <SchemaField key={index}
            name={name}
            required={this.isRequired(name)}
            schema={schema.properties[name]}
            uiSchema={uiSchema[name]}
            formData={this.state[name]}
            onChange={this.onChange.bind(this, name)} />;
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
  };
}

export default ObjectField;
