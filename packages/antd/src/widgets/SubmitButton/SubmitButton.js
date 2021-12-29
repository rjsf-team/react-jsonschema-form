import { utils } from '@rjsf/core';
import React from "react";
import Button from 'antd/lib/button';
const { getSubmitButtonProps } = utils;
export default ({ uiSchema }) => {
  const { submitText, required, ...submitButtonProps }= getSubmitButtonProps(uiSchema);
  if (!required) {return null;}
  return (<Button  type="submit" {...submitButtonProps}>
    {submitText}
  </Button>);
};

