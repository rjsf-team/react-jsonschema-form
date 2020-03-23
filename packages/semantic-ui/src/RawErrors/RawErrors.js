/* eslint-disable react/no-array-index-key */
import React from "react";
import PropTypes from "prop-types";
import shortid from "shortid";
import { Message } from "semantic-ui-react";

/**
 *
 * @param errors
 * @param displayError
 * @returns {*}
 * @constructor
 * @return {null}
 */
function RawErrors({ errors, displayError }) {
  if (displayError && errors && errors.length > 0) {
    return (
      <Message negative size="mini">
        <Message.List>
          {errors.map(error => (
            <Message.Item key={shortid.generate()}>{error}</Message.Item>
          ))}
        </Message.List>
      </Message>
    );
  }
  return null;
}

RawErrors.defaultProps = {
  displayError: false,
};

RawErrors.propTypes = {
  errors: PropTypes.array,
  displayError: PropTypes.bool,
};

export default RawErrors;
