/* eslint-disable react/no-array-index-key */
import React from "react";
import PropTypes from "prop-types";
import { Message } from "semantic-ui-react";

/**
 *
 * @param errors
 * @returns {*}
 * @constructor
 */
function ErrorList({ errors }) {
  return (
    <Message negative>
      <Message.Header>Errors</Message.Header>
      <Message.List>
        {errors.map((error, index) => (
          <Message.Item key={`error-${index}`}>{error.stack}</Message.Item>
        ))}
      </Message.List>
    </Message>
  );
}

ErrorList.propTypes = {
  errors: PropTypes.array,
};

export default ErrorList;
