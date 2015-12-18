import React, { Component } from "react";

import StringField from "./StringField";
import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import ObjectField from "./ObjectField";
import UnsupportedField from "./UnsupportedField";


export default class SchemaField extends Component {
  static get fieldComponents() {
    return {
      string: StringField,
      array:  ArrayField,
      boolean: BooleanField,
      object: ObjectField,
      "date-time": StringField,
      number: StringField,
    };
  }

  render() {
    const {schema} = this.props;
    const FieldComponent = SchemaField.fieldComponents[schema.type] ||
      UnsupportedField;
    return <FieldComponent {...this.props} />;
  }
}
