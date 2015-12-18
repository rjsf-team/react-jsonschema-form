import React, { Component } from "react";


export default class ErrorList extends Component {
  render() {
    const {errors} = this.props;
    if (errors.length === 0) {
      return null;
    }
    return <div className="errors">
      <h2>Errors</h2>
      <ul>{
        errors.map((error, i) => {
          return <li key={i}>{error.stack}</li>;
        })
      }</ul>
    </div>;
  }
}
