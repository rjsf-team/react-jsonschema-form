/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Icon, Popup } from "semantic-ui-react";

/**
 * @return {null}
 */
function HelpField({ className, helpText, inline, inlineStyle }) {
  if (helpText) {
    return inline ? (
      <p className={className || "sui-help-inline"}>{helpText}</p>
    ) : (
      <Popup
        className={className || "sui-help"}
        content={helpText}
        position='left center'
        trigger={<Icon color="grey" name="help circle" style={inlineStyle} />}
      />
    );
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
