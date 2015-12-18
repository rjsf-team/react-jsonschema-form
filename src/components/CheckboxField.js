import React, { Component } from "react";

import { defaultFieldValue } from "../utils";
import Field from "./Field";

export default class CheckboxField extends Component {
  onChange(event) {
    this.props.onChange(event.target.checked);
  }

  render() {
    const {schema, formData, label, required, placeholder} = this.props;
    return (
      <Field label={label} required={required} type={schema.type}>
        <input type="checkbox"
          title={placeholder}
          checked={defaultFieldValue(formData, schema)}
          required={required}
          onChange={this.onChange.bind(this)} />
      </Field>
    );
  }
}
