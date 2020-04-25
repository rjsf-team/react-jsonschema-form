/* eslint-disable react/no-array-index-key */
import React from "react";
import PropTypes from "prop-types";
import shortid from "shortid";
import { Label, List } from "semantic-ui-react";

/**
 *
 * @param errors
 * @param displayError
 * @returns {*}
 * @constructor
 * @return {null}
 */
function RawErrors({ errors, size }) {
  if (errors && errors.length > 0) {
    return (
      <Label color="red" pointing="above" size={size} basic>
        <List bulleted>
          {errors.map(error => (
            <List.Item key={shortid.generate()} content={error} />
          ))}
        </List>
      </Label>
    );
  }
  return null;
}

RawErrors.defaultProps = {
  size: "small",
};

RawErrors.propTypes = {
  errors: PropTypes.array,
  size: PropTypes.string,
};

export default RawErrors;
