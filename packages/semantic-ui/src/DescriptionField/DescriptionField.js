/* eslint-disable react/prop-types */
import React from "react";
import { Message } from "semantic-ui-react";

function DescriptionField({ description }) {
  if (description) {
    return <Message content={description} attached="bottom" size="tiny" />;
  }
  return null;
}

export default DescriptionField;
