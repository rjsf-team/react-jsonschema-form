/* eslint-disable react/prop-types */
import React from 'react';
import { Message } from 'semantic-ui-react';

/**
 * @return {null}
 */
function HelpField({ helpText, id }) {
  if (helpText) {
    return (
      <Message id={id} info content={helpText} attached="bottom" size="mini" />
    );
  }
  return null;
}

export default HelpField;
