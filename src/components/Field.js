import React, { Component } from "react";

const REQUIRED_FIELD_SYMBOL = "*";

export default class Field extends Component {
  get label() {
    const {label, required} = this.props;
    if (!label) {
      return null;
    }
    if (required) {
      return label + REQUIRED_FIELD_SYMBOL;
    }
    return label;
  }

  render() {
    const {type, children} = this.props;
    return (
      <div className={`field field-${type}`}>
        <label>
          {this.label}
          {children}
        </label>
      </div>
    );
  }
}
