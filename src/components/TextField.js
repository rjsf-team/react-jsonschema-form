import React, { Component } from "react";

import { defaultFieldValue } from "../utils";
import Field from "./Field";


export default class TextField extends Component {
  onChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    const {schema, formData, label, required, placeholder} = this.props;
    return (
      <Field label={label} required={required}
        type={schema.type}>
        <input type="text"
          value={defaultFieldValue(formData, schema)}
          defaultValue={schema.default}
          placeholder={placeholder}
          required={required}
          onChange={this.onChange.bind(this)} />
      </Field>
    );
  }
}
