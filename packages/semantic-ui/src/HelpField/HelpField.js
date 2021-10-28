/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Message } from "semantic-ui-react";

/**
 * @return {null}
 */
function HelpField({ helpText, id }) {
  if (helpText) {
    return <Message size="mini" info id={id} content={helpText} />;
  }
  return null;
}

HelpField.propTypes = {
  helpText: PropTypes.string,
  id: PropTypes.string,
};

export default HelpField;
