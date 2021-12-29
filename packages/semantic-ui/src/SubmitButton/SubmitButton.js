import { utils } from '@rjsf/core';
import React from "react";
import { Button } from "semantic-ui-react";
const { getSubmitButtonProps } = utils;
export default ({ uiSchema }) => {
  const { submitText, required, ...submitButtonProps }= getSubmitButtonProps(uiSchema);
  if (!required) {return null;}
  return (<Button  type="submit" primary {...submitButtonProps}>
    {submitText}
  </Button>);
};

