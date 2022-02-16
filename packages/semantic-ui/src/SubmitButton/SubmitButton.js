import { utils } from '@rjsf/core';
import React from "react";
import { Button } from "semantic-ui-react";
const { getSubmitButtonOptions } = utils;
export default ({ uiSchema }) => {
  const { submitText, removed, props: submitButtonProps }= getSubmitButtonOptions(uiSchema);
  if (removed) {return null;}
  return (<Button  type="submit" primary {...submitButtonProps}>
    {submitText}
  </Button>);
};

