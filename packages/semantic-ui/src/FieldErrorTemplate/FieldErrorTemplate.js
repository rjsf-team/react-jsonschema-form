/* eslint-disable react/no-array-index-key */
import React from "react";
import PropTypes from "prop-types";
import { nanoid } from "nanoid";
import { Label, List } from "semantic-ui-react";

import { getSemanticErrorProps } from "../util";

/**
 *
 * @param errors
 * @param displayError
 * @returns {*}
 * @constructor
 * @return {null}
 */
function FieldErrorTemplate({ errors, idSchema, uiSchema, registry }) {
  const { formContext } = registry;
  const options = getSemanticErrorProps({ formContext, uiSchema });
  const { pointing, size } = options;
  if (errors && errors.length > 0) {
    const id = `${idSchema.$id}__error`;
    return (
      <Label
        id={id}
        color="red"
        pointing={pointing || "above"}
        size={size || "small"}
        basic
      >
        <List bulleted>
          {errors.map((error) => (
            <List.Item key={nanoid()}>{error}</List.Item>
          ))}
        </List>
      </Label>
    );
  }
  return null;
}

FieldErrorTemplate.defaultProps = {
  options: {
    pointing: "above",
    size: "small",
  },
};

FieldErrorTemplate.propTypes = {
  options: PropTypes.object,
  errors: PropTypes.array,
};

export default FieldErrorTemplate;
