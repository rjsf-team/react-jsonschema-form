import { utils } from '@rjsf/core';
import React from "react";
import { Button } from "semantic-ui-react";
const { getSubmitButtonProps } = utils;
export default ({ uiSchema }) => {
  const { submitText, allowed, ...submitButtonProps }= getSubmitButtonProps(uiSchema);
  if (!allowed) {return null;}
  return (<Button  type="submit" primary {...submitButtonProps}>
    {submitText}
  </Button>);
};

