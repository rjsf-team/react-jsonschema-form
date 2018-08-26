import React from "react";

import Form from "./Form";
import fields from "./fields";

export const initWithTheme = (WrappedForm, fields) => (name, theme) => {
  class WithTheme extends React.Component {
    state = mergeComponents(this.props);

    componentWillReceiveProps(nextProps) {
      if (
        this.props.fields !== nextProps.fields ||
        this.props.widgets !== nextProps.widgets ||
        this.props.templates !== nextProps.templates
      ) {
        this.setState(mergeComponents(nextProps));
      }
    }

    render() {
      return (
        <WrappedForm
          {...this.props}
          fields={this.state.fields}
          widgets={this.state.widgets}
          templates={this.state.templates}
        />
      );
    }
  }

  WithTheme.displayName = `WithTheme(${name})`;

  return WithTheme;

  function mergeComponents(props) {
    return {
      fields: { ...fields, ...props.fields },
      widgets: { ...theme.widgets, ...props.widgets },
      templates: { ...theme.templates, ...props.templates },
    };
  }
};

export default initWithTheme(Form, fields);
