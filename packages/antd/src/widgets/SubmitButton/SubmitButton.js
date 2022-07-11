import { utils } from '@rjsf/core';
import React from "react";
import Button from 'antd/lib/button';
const { getSubmitButtonOptions } = utils;
export default ({ uiSchema }) => {
  const { submitText, norender, props: submitButtonProps }= getSubmitButtonOptions(uiSchema);
  if (norender) {return null;}
  return (<Button htmlType="submit" {...submitButtonProps}>
    {submitText}
  </Button>);
};

