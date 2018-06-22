import React, { Component } from 'react';
import PropTypes from 'prop-types';

import FormContainer from './FormContainer';
import baseFields from './fields';

class Form extends Component {
  render() {
    const { theme, fields = {}, widgets = {}, ...props } = this.props;
    const components = {
      fields: { ...baseFields, ...fields },
      widgets: { ...theme.widgets, ...widgets }
    };

    return <FormContainer {...props} {...components} />;
  }
}

if (process.env.NODE_ENV !== 'production') {
  Form.propTypes = {
    theme: PropTypes.shape({
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired
    }).isRequired
  };
}

export default Form;
