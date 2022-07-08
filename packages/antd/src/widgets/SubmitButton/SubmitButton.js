import { getSubmitButtonOptions } from '@rjsf/utils';
import React from "react";
import Button from 'antd/lib/button';

export default ({ uiSchema }) => {
  const { submitText, norender, props: submitButtonProps }= getSubmitButtonOptions(uiSchema);
  if (norender) {return null;}
  return (<Button  type="submit" {...submitButtonProps}>
    {submitText}
  </Button>);
};

