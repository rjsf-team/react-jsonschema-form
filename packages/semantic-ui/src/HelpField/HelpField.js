/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Message } from "semantic-ui-react";

/**
 * @return {null}
 */
function HelpField({ className, helpText, inline, inlineStyle, id }) {
  if (helpText) {
    return <Message size="mini" info id={id} content={helpText} />;
  }
  return null;
}

HelpField.propTypes = {
  inline: PropTypes.bool,
  inlineStyle: PropTypes.object,
};

HelpField.defaultProps = {
  inlineStyle: { position: "absolute", top: "0.2rem", right: "0.2rem" },
};

export default HelpField;
