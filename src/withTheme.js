import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import Form from "./";

function withTheme(themeProps) {
  return forwardRef(({ fields, widgets, ...directProps }, ref) => (
    <Form
      {...themeProps}
      {...directProps}
      fields={{ ...themeProps.fields, ...fields }}
      widgets={{ ...themeProps.widgets, ...widgets }}
      ref={ref}
    />
  ));
}

withTheme.propTypes = {
  widgets: PropTypes.object,
  fields: PropTypes.object,
};

export default withTheme;
