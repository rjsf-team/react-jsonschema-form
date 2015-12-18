import React, { Component } from "react";

import { defaultFieldValue } from "../utils";
import Field from "./Field";

export default class SelectField extends Component {
  onChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    const {schema, formData, options, required, label} = this.props;
    return (
      <Field label={label} required={required}>
        <select value={defaultFieldValue(formData, schema)}
          title={schema.description}
          onChange={this.onChange.bind(this)}>{
          options.map((option, i) => {
            return <option key={i}>{option}</option>;
          })
        }</select>
      </Field>
    );
  }
}
