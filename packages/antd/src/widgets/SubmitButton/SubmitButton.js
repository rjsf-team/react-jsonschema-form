import { utils } from '@rjsf/core';
import React from "react";
import Button from 'antd/lib/button';
const { getSubmitButtonProps } = utils;
export default ({ uiSchema }) => {
  const { submitText, allowed, ...submitButtonProps }= getSubmitButtonProps(uiSchema);
  if (!allowed) {return null;}
  return (<Button  type="submit" {...submitButtonProps}>
    {submitText}
  </Button>);
};

