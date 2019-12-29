//
// TODO: Deprecate when forwardRef bug resolved in original code.
// https://github.com/rjsf-team/react-jsonschema-form/pull/1498
//
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import Form from 'react-jsonschema-form';

const withTheme = themeProps =>
  forwardRef(({ fields, widgets, ...directProps }, forwardedRef) => {
    const nextFields = { ...themeProps.fields, ...fields };
    const nextWidgets = { ...themeProps.widgets, ...widgets };

    return (
      <Form
        {...themeProps}
        {...directProps}
        fields={nextFields}
        ref={forwardedRef}
        widgets={nextWidgets}
      />
    );
  });

withTheme.propTypes = {
  fields: PropTypes.object,
  widgets: PropTypes.object,
};

export default withTheme;
