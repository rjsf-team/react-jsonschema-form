import React, { Component } from "react";

import TextField from "./TextField";
import SelectField from "./SelectField";


export default class StringField extends Component {
  render() {
    const {schema, formData, required, onChange} = this.props;
    const commonProps = {
      schema,
      label:    schema.title,
      formData: formData,
      required: required,
      onChange: onChange.bind(this),
    };
    if (Array.isArray(schema.enum)) {
      return <SelectField options={schema.enum} {...commonProps} />;
    }
    return <TextField placeholder={schema.description} {...commonProps} />;
  }
}
