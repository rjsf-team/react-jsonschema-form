import { utils } from '@rjsf/core';
import React from "react";
import Button from 'antd/lib/button';
const { getSubmitButtonOptions } = utils;
export default ({ uiSchema }) => {
  const { submitText, removed, props: submitButtonProps }= getSubmitButtonOptions(uiSchema);
  if (removed) {return null;}
  return (<Button  type="submit" {...submitButtonProps}>
    {submitText}
  </Button>);
};

