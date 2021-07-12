/* eslint-disable react/no-array-index-key */
import React from "react";
import PropTypes from "prop-types";
import { nanoid } from "nanoid";
import { Label, List } from "semantic-ui-react";

/**
 *
 * @param errors
 * @param displayError
 * @returns {*}
 * @constructor
 * @return {null}
 */
function RawErrors({ errors, options }) {
  const { pointing, size } = options;
  if (errors && errors.length > 0) {
    return (
      <Label color="red" pointing={pointing || "above"} size={size || "small"} basic>
        <List bulleted>
          {errors.map(error => (
            <List.Item key={nanoid()} content={error} />
          ))}
        </List>
      </Label>
    );
  }
  return null;
}

RawErrors.defaultProps = {
  options: {
    pointing: "above",
    size: "small",
  },
};

RawErrors.propTypes = {
  options:PropTypes.object,
  errors: PropTypes.array,
};

export default RawErrors;
