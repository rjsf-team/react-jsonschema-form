import React, { Component } from "react";

import CheckboxField from "./CheckboxField";


export default class BooleanField extends Component {
  render() {
    const {schema, formData, required, onChange} = this.props;
    const commonProps = {
      schema,
      label:    schema.title,
      formData: formData,
      required: required,
      onChange: onChange.bind(this),
    };
    return <CheckboxField placeholder={schema.description} {...commonProps} />;
  }
}
