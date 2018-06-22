import React, { Component } from 'react';
import PropTypes from 'prop-types';

import FormContainer from './FormContainer';
import baseFields from './fields';

class Form extends Component {
  render() {
    const {
      theme,
      fields = {},
      templates = {},
      widgets = {},
      ...props
    } = this.props;
    const components = {
      fields: { ...baseFields, ...fields },
      templates: { ...theme.templates, ...templates },
      widgets: { ...theme.widgets, ...widgets }
    };

    return <FormContainer {...props} {...components} />;
  }
}

if (process.env.NODE_ENV !== 'production') {
  Form.propTypes = {
    theme: PropTypes.shape({
      templates: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired,
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired
    }).isRequired
  };
}

export default Form;
