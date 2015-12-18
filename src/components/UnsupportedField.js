import React, { Component } from "react";

export default class UnsupportedField extends Component {
  render() {
    // XXX render json as string so dev can inspect faulty subschema
    return <div className="unsupported-field">
      Unsupported field schema {JSON.stringify(this.props.schema)}.
    </div>;
  }
}
