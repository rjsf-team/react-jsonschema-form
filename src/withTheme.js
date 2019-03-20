import React, { Component } from "react";
import PropTypes from "prop-types";
import Form from "./";

function withTheme(data) {
  return class extends Component {
    render() {
      let { templates, widgets, fields, ...otherProps } = this.props;
      templates = { ...data.templates, ...templates };
      widgets = { ...data.widgets, ...widgets };
      fields = { ...data.Fields, ...fields };
      let ThemedForm = Form;
      if (data.form) {
        ThemedForm = data.form;
      }
      return (
        <ThemedForm
          {...otherProps}
          {...templates}
          widgets={widgets}
          fields={fields}
        />
      );
    }
  };
}

withTheme.propTypes = {
  form: PropTypes.object,
  widgets: PropTypes.object,
  fields: PropTypes.object,
  templates: PropTypes.object,
};

export default withTheme;
