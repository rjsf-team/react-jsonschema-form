import React from 'react';
// import PropTypes from 'prop-types';

import { ErrorListProps } from 'react-jsonschema-form';

const ErrorList = ({
  // errorSchema,
  errors,
  // formContext,
  // schema,
  // uiSchema,
}) => (
  <div>
    <ul>
      {errors.map((error, index) => (
        <li key={index} style={{ margin: '3px' }}>
          {error.stack}
        </li>
      ))}
    </ul>
  </div>
);

ErrorList.propTypes = ErrorListProps;

export default ErrorList;
