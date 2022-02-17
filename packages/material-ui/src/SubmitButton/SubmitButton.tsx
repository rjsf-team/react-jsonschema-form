import React from 'react';
import Box from "@material-ui/core/Box";
import { WidgetProps, utils } from '@rjsf/core';

import Button from '@material-ui/core/Button';

const { getSubmitButtonOptions } = utils;
const SubmitButton: React.FC<WidgetProps> = props => {
  const { submitText, removed, props: submitButtonProps }= getSubmitButtonOptions(props.uiSchema);
  if(removed) return null;
  return (
    <Box marginTop={3}>
      <Button type="submit" variant="contained" color="primary" {...submitButtonProps}>
        {submitText}
      </Button>
    </Box>
  );
};

export default SubmitButton;
