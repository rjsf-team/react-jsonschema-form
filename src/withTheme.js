import React, { Component } from "react";
import PropTypes from "prop-types";
import Form from "./";

function withTheme(themeProps) {
  return class extends Component {
    render() {
      let { fields, widgets, ...directProps } = this.props;
      fields = { ...themeProps.fields, ...fields };
      widgets = { ...themeProps.widgets, ...widgets };
      return (
        <Form
          {...themeProps}
          {...directProps}
          fields={fields}
          widgets={widgets}
        />
      );
    }
  };
}

withTheme.propTypes = {
  widgets: PropTypes.object,
  fields: PropTypes.object,
};

export default withTheme;
